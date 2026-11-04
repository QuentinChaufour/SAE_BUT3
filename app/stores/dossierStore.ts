import type {
  DemarcheContact,
  DemarcheEvenement,
  DepartementTag,
  Entreprise,
  PieceJointe,
  RechercheStage,
} from '~~/generated/prisma/client'
import { dateToString } from '~~/shared/utils/date'
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'
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
    Pick<DemarcheEvenement, 'description'| 'titre' | 'status' | 'source' | 'idDemarche'> & {
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
    dossier: DossierFull | null,
    events: EventInfo[],
    dossierTags: string[],
}

export const useDossierStore = defineStore('dossier', {
  state: () : StoreState => ({
    dossier: null,
    events: [],
    dossierTags: [],
  }),

  getters: {
    getStatus: (state) => state.events[0]?.status ?? Recherche_Stage_Status.AttenteEnvoi,
    getContacts: (state): ContactInfo[] => {
      if(!state.dossier) return []

      const contacts = []
      const idSet = new Set<number>()

      for (const contact of state.dossier.DemarcheEvenement.flatMap(e => e.DemarcheRechercheContact.map(c => c.DemarcheContact))) {
        // ensure distinct contacts
        if (idSet.has(contact.idContact)) {
          continue
        }
        contacts.push({
          value: String(contact.idContact),
          label: `${contact.nom} ${contact.prenom}`,
          content: '',
          idContact: contact.idContact,
          nom: contact.nom || '',
          prenom: contact.prenom || '',
          fonction: contact.fonction || '',
          email: contact.email || '',
          telephone: contact.telephone || ''
        })
        idSet.add(contact.idContact)
      }
      return contacts
    }
  },

  actions: {
    async initState(idDossier: number){
    try {
        const response = await $fetch<APIResponse<DossierFull>>(
          `/api/dossier/${idDossier}`,
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
          const date = new Date(Date.parse(event.date))
          this.events.push({
            date: dateToString(date),
            title: event.titre || 'Pas de titre',
            idDemarche: event.idDemarche,
            titre: event.titre || 'Pas de titre',
            description: event.description || '',
            icon: 'i-lucide-rocket',
            status: event.status,
            source: event.source,
            contacts: event.DemarcheRechercheContact.map(c => c.DemarcheContact),
            files: event.LienPj.map(pj => { return { nom: pj.PieceJointe.nom, idPieceJointe: pj.PieceJointe.idPieceJointe }; })
          })
        }
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
      } catch (e) {
        throw e
      }
    },
    addEvent(event: EventInfo) {
      const date = new Date(Date.parse(event.date))
      this.events.push({
        date: dateToString(date),
        idDemarche: event.idDemarche,
        title: event.titre || 'Pas de titre',
        titre: event.titre || 'Pas de titre',
        description: event.description || '',
        icon: 'i-lucide-rocket',
        status: event.status,
        source: event.source,
        contacts: event.contacts,
        files: event.files
      })
    
      // sort the events by date, newest first
      this.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, 

    updateContacts(contact: ContactInfo, index?: number){
      if (index !== undefined) {
        const existing = this.getContacts[index]

        if (!existing) {
          throw new Error(`No contact found at index ${index}`)
        }
      
        Object.assign(existing, {
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
  }
})