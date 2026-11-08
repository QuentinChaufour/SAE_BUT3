import type {
  DemarcheContact,
  DemarcheEvenement,
  DepartementTag,
  Entreprise,
  PieceJointe,
  RechercheStage
} from '~~/generated/prisma/client'
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'
import { dateToString } from '~~/shared/utils/date'
import type { APIResponse } from '~~/shared/types/apiResponse'
import type { EventInfo } from '~~/shared/types/event'
import type { ContactInfo } from '~~/shared/types/contact'

type DossierFull = Pick<
  RechercheStage,
  'idRecherche' | 'titre' | 'description' | 'alternance'
> & {
  Entreprise: Pick<
    Entreprise,
    'nom' | 'adresse' | 'codePostal' | 'ville'
  >

  DemarcheEvenement: Array<
    Pick<DemarcheEvenement, 'description' | 'titre' | 'status' | 'source' | 'idDemarche'> & {
      // Date values are serialized as strings by the API.
      date: string

      LienPj: Array<{
        PieceJointe: Pick<PieceJointe, 'nom' | 'idPieceJointe'>
      }>

      DemarcheRechercheContact: Array<{
        DemarcheContact: DemarcheContact
      }>
    }
  >

  DepartementTagRecherche: Array<{
    DepartementTag: DepartementTag
  }>
}

interface StoreState {
  dossier: DossierFull | null
  events: EventInfo[]
  contacts: DemarcheContact[]
  dossierTags: string[]
}

export const useDossierStore = defineStore('dossier', {
  state: (): StoreState => ({
    dossier: null,
    events: [],
    contacts: [],
    dossierTags: []
  }),

  getters: {
    /**
     * Get the search status of the last event for the current dossier.
     * @param state the store State
     * @returns The state of the last event
     */
    getStatus: state => state.events[0]?.status ?? Recherche_Stage_Status.AttenteEnvoi,

    /**
     * Get the ID of the current dossier.
     * @param state the store State
     * @returns The ID of the current dossier, or null if no dossier is selected.
     */
    getDossierId: state => state.dossier?.idRecherche
  },

  actions: {
    async initState(idDossier: number) {

      const session = useUserSession()
      const response = await $fetch<APIResponse<DossierFull>>(
        `/api/students/${session.user.value?.numId}/dossier/${idDossier}`,
        { method: 'GET' }
      )

      if (response.statusCode !== 200 || !response.data) {
        return
      }
      this.dossier = response.data
      this.events = []
      this.dossierTags = []

      // populate the dossierTags array with the tags from the dossier
      for (const tag of this.dossier?.DepartementTagRecherche ?? []) {
        this.dossierTags.push(tag.DepartementTag.nomTag)
      }

      // populate the timeline items with the events from the dossier
      for (const event of this.dossier?.DemarcheEvenement ?? []) {
        this.events.push({
          date: dateToString(new Date(event.date)),
          idDemarche: event.idDemarche,
          titre: event.titre || 'Pas de titre',
          description: event.description || '',
          status: event.status,
          source: event.source,
          contacts: event.DemarcheRechercheContact.map(c => c.DemarcheContact),
          files: event.LienPj.map((pj) => { return { nom: pj.PieceJointe.nom, idPieceJointe: pj.PieceJointe.idPieceJointe } })
        })
      }

      this.contacts = await this.fetchContacts()
      /*
          for (const file of this.dossier.DemarcheEvenement.flatMap(e => e.LienPj.map(pj => pj.PieceJointe))) {
            // skip files with no name
            if (!file.nom) {
              continue
            }

            let fileType = ''

            // Only pdf and image files are supported for now,
            // so we can use a simple check to determine the file type
            if (file.nom.endsWith('.pdf')) {
              fileType = 'application/pdf'
            } else {
              fileType = 'image/*'
            }

            this.files.push({
              name: file.nom,
              type: fileType,
              avatar: {
                icon: fileType === 'application/pdf' ? 'i-lucide-file-text' : 'i-lucide-image'
              }
            })
*/
    },
    async updateDossier(state: { description: string, titre: string }) {
      if (!this.dossier) throw new Error('No dossier selected')

      try {
        const session = useUserSession()
        const response = await $fetch<APIResponse<null>>(`/api/students/${session.user.value?.numId}/dossier/${this.getDossierId}`, {
          method: 'PATCH',
          body: state
        })

        if (response.statusCode !== 200) {
          throw new Error('Failed to update dossier')
        }

        this.dossier.description = state.description
        this.dossier.titre = state.titre
      } catch (error) {
        console.error('Error updating dossier:', error)
        throw error
      }
    },
    async createEvent(event: EventInfo) {
      try {
        const session = useUserSession()
        const response = await $fetch<APIResponse<EventInfo>>(`/api/students/${session.user.value?.numId}/dossier/${this.getDossierId}/evenements`, {
          method: 'POST',
          body: {
            ...event,
            idDemarche: undefined,
            contacts: event.contacts?.map(contact => contact.idContact)
          }
        })

        if (!response.data || response.statusCode !== 201) {
          throw new Error('Erreur lors de la création de l\'événement')
        }
        this.events.push({
          date: dateToString(new Date(response.data.date)),
          idDemarche: response.data.idDemarche,
          titre: response.data.titre || 'Pas de titre',
          description: response.data.description || '',
          status: response.data.status,
          source: response.data.source,
          contacts: response.data.contacts,
          files: response.data.files
        })

        this.contacts = await this.fetchContacts()
        this.orderEvents()
      } catch (error) {
        console.error('Error creating event:', error)
        throw error
      }
    },
    async updateEvent(event: EventInfo) {
      const dossierId = this.getDossierId
      try {
        const session = useUserSession()
        const response = await $fetch<APIResponse<EventInfo>>(`/api/students/${session.user.value?.numId}/dossier/${dossierId}/evenements/${event.idDemarche}`, {
          method: 'PUT',
          body: {
            ...event,
            contacts: event.contacts?.map(contact => contact.idContact)
          }
        })

        if (!response.data || response.statusCode !== 200) {
          throw new Error('Erreur lors de la mise à jour de l\'événement')
        }

        const existingEvent = this.events.findIndex(e => e.idDemarche === event.idDemarche)

        if (existingEvent === -1 || !this.events[existingEvent]) {
          throw new Error('Événement introuvable dans le store')
        }

        Object.assign(this.events[existingEvent], {
          ...event,
          title: response.data.titre || 'Pas de titre'
        })
        // TODO delete contact if no longer used in any event
        this.contacts = await this.fetchContacts()
      } catch (error) {
        console.error('Error updating event:', error)
        throw error
      }
    },
    async deleteEvent(event: EventInfo) {
      try {
        const session = useUserSession()
        const response = await $fetch<APIResponse<EventInfo>>(`/api/students/${session.user.value?.numId}/dossier/${this.getDossierId}/evenements/${event.idDemarche}`, {
          method: 'DELETE'
        })

        if (response.statusCode !== 204) {
          throw new Error(response.message || 'Erreur lors de la suppression de l\'événement')
        }

        this.events = this.events.filter(e => e.idDemarche !== event.idDemarche)
        this.contacts = await this.fetchContacts()
      } catch (error) {
        console.error('Error deleting event:', error)
        throw error
      }
    },
    updateContacts(contact: ContactInfo) {
      const contactIndex = this.contacts.findIndex(c => c.idContact === contact.idContact)
      if (contactIndex === -1 || !this.contacts[contactIndex]) {
        throw new Error(`No contact found for ID ${contact.idContact}`)
      }

      Object.assign(this.contacts[contactIndex], {
        label: `${contact.prenom} ${contact.nom}`,
        idContact: contact.idContact,
        nom: contact.nom || '',
        prenom: contact.prenom || '',
        fonction: contact.fonction || '',
        email: contact.email || '',
        telephone: contact.telephone || ''
      })

      // Update the contact information in all events that reference this contact
      this.events.forEach((event) => {
        if (event.contacts) {
          const eventContactIndex = event.contacts.findIndex(c => c.idContact === contact.idContact)
          if (eventContactIndex !== -1 && event.contacts[eventContactIndex]) {
            Object.assign(event.contacts[eventContactIndex], {
              label: `${contact.nom} ${contact.prenom}`,
              idContact: contact.idContact,
              nom: contact.nom || '',
              prenom: contact.prenom || '',
              fonction: contact.fonction || '',
              email: contact.email || '',
              telephone: contact.telephone || ''
            })
          }
        }
      })
    },
    createContact(contact: DemarcheContact) {
      this.contacts.push(contact)
    },
    deleteContact(idContact: number) {
      this.contacts = this.contacts.filter(c => c.idContact !== idContact)
      this.events.forEach((event) => {
        if (event.contacts) {
          event.contacts = event.contacts.filter(c => c.idContact !== idContact)
        }
      })
    },

    async fetchContacts() {
      const session = useUserSession()
      const response = await $fetch<APIResponse<DemarcheContact[]>>(`/api/students/${session.user.value?.numId}/dossier/${this.getDossierId}/contacts`, {
        method: 'GET'
      })
      return response.data ?? []
    },
    /**
        * Sort the events array by date in descending order (most recent first).
        * @param state the store State
        * @returns void
      */
    orderEvents() {
      this.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  }
})
