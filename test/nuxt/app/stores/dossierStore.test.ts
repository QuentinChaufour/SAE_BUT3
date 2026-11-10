import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDossierStore } from '~/stores/dossierStore'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn()
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useUserSession', () => () => ({
  user: { value: { numId: 'o123456789' } }
}))

const contact = {
  idContact: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean@example.com',
  telephone: '0600000000',
  fonction: 'RH',
  idRecherche: 42
}

const dossierResponse = {
  idRecherche: 42,
  titre: 'Stage développeur',
  description: 'Recherche de stage',
  alternance: false,
  Entreprise: {
    nom: 'Acme',
    adresse: '1 rue du Test',
    codePostal: '75000',
    ville: 'Paris'
  },
  DepartementTagRecherche: [
    { DepartementTag: { nomTag: 'Java' } }
  ],
  DemarcheEvenement: [{
    idDemarche: 8,
    titre: null,
    description: null,
    date: '2026-11-07T00:00:00.000Z',
    status: Recherche_Stage_Status.Entretien,
    source: Demarche_Source.Email,
    DemarcheRechercheContact: [{ DemarcheContact: contact }],
    LienPj: [{ PieceJointe: { idPieceJointe: 3, nom: 'cv.pdf' } }]
  }]
}

const event = {
  idDemarche: 0,
  titre: 'Entretien',
  description: 'Premier échange',
  date: '07/11/2026',
  status: Recherche_Stage_Status.Entretien,
  source: Demarche_Source.Telephone,
  contacts: [contact]
}

describe('dossierStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.fetch.mockReset()
  })

  it('starts with empty state and default getters', () => {
    const store = useDossierStore()

    expect(store.dossier).toBeNull()
    expect(store.events).toEqual([])
    expect(store.contacts).toEqual([])
    expect(store.dossierTags).toEqual([])
    expect(store.getStatus).toBe(Recherche_Stage_Status.AttenteEnvoi)
    expect(store.getDossierId).toBeUndefined()
  })

  it('initializes dossier data, tags, events, and contacts', async () => {
    mocks.fetch
      .mockResolvedValueOnce({ statusCode: 200, data: dossierResponse })
      .mockResolvedValueOnce({ statusCode: 200, data: [contact] })
    const store = useDossierStore()

    await store.initState(42)

    expect(mocks.fetch).toHaveBeenNthCalledWith(1, '/api/students/o123456789/dossier/42', { method: 'GET' })
    expect(mocks.fetch).toHaveBeenNthCalledWith(2, '/api/students/o123456789/dossier/42/contacts', { method: 'GET' })
    expect(store.getDossierId).toBe(42)
    expect(store.dossierTags).toEqual(['Java'])
    expect(store.events).toEqual([{
      date: '2026-11-07T00:00:00.000Z',
      idDemarche: 8,
      titre: 'Pas de titre',
      description: '',
      status: Recherche_Stage_Status.Entretien,
      source: Demarche_Source.Email,
      contacts: [contact],
      files: [{ idPieceJointe: 3, nom: 'cv.pdf' }]
    }])
    expect(store.contacts).toEqual([contact])
  })

  it.each([
    [{ statusCode: 404, data: dossierResponse }],
    [{ statusCode: 200, data: null }]
  ])('does not initialize on an invalid dossier response', async (response) => {
    const store = useDossierStore()
    mocks.fetch.mockResolvedValueOnce(response)

    await store.initState(42)

    expect(store.dossier).toBeNull()
    expect(store.events).toEqual([])
  })

  it('updates the dossier through the API and local state', async () => {
    const store = useDossierStore()
    store.$patch({ dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] } })
    mocks.fetch.mockResolvedValueOnce({ statusCode: 200, data: null })

    await store.updateDossier({ titre: 'Nouveau titre', description: 'Nouvelle description', alternance: false })

    expect(mocks.fetch).toHaveBeenCalledWith('/api/students/o123456789/dossier/42', {
      method: 'PATCH',
      body: { titre: 'Nouveau titre', description: 'Nouvelle description', alternance: false }
    })
    expect(store.dossier?.titre).toBe('Nouveau titre')
    expect(store.dossier?.description).toBe('Nouvelle description')
  })

  it('rejects dossier updates without a selected dossier or with an API error', async () => {
    const store = useDossierStore()

    await expect(store.updateDossier({ titre: 'Titre', description: '', alternance: false })).rejects.toThrow('No dossier selected')

    store.$patch({ dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] } })
    mocks.fetch.mockResolvedValueOnce({ statusCode: 500 })
    await expect(store.updateDossier({ titre: 'Titre', description: '', alternance: false })).rejects.toThrow('Failed to update dossier')
  })

  it('creates an event, refreshes contacts, and orders events', async () => {
    const store = useDossierStore()
    store.$patch({ dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] } })
    const createdEvent = { ...event, idDemarche: 9, date: '2026-11-08T00:00:00.000Z' }
    mocks.fetch
      .mockResolvedValueOnce({ statusCode: 201, data: createdEvent })
      .mockResolvedValueOnce({ statusCode: 200, data: [contact] })

    await store.createEvent(event)

    expect(mocks.fetch).toHaveBeenNthCalledWith(1, '/api/students/o123456789/dossier/42/evenements', {
      method: 'POST',
      body: { ...event, idDemarche: undefined, contacts: [contact.idContact] }
    })
    expect(store.events[0]).toMatchObject({
      idDemarche: 9,
      date: '2026-11-08T00:00:00.000Z'
    })
    expect(store.contacts).toEqual([contact])
  })

  it('rejects unsuccessful event creation', async () => {
    const store = useDossierStore()
    store.$patch({ dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] } })
    mocks.fetch.mockResolvedValueOnce({ statusCode: 400, data: null })

    await expect(store.createEvent(event)).rejects.toThrow('Erreur lors de la création de l\'événement')
  })

  it('updates an event and refreshes contacts', async () => {
    const store = useDossierStore()
    store.$patch({
      dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] },
      events: [{ ...event, idDemarche: 9 }],
      contacts: []
    })
    const updatedEvent = { ...event, idDemarche: 9, titre: 'Entretien mis à jour' }
    mocks.fetch
      .mockResolvedValueOnce({ statusCode: 200, data: updatedEvent })
      .mockResolvedValueOnce({ statusCode: 200, data: [contact] })

    await store.updateEvent(updatedEvent)

    expect(mocks.fetch).toHaveBeenNthCalledWith(1, '/api/students/o123456789/dossier/42/evenements/9', {
      method: 'PUT',
      body: { ...updatedEvent, contacts: [contact.idContact] }
    })
    expect(store.events[0]).toMatchObject({ titre: 'Entretien mis à jour' })
    expect(store.contacts).toEqual([contact])
  })

  it('rejects updates for missing events or unsuccessful responses', async () => {
    const store = useDossierStore()
    store.$patch({ dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] } })
    mocks.fetch.mockResolvedValueOnce({ statusCode: 200, data: event })

    await expect(store.updateEvent(event)).rejects.toThrow('Événement introuvable dans le store')

    mocks.fetch.mockResolvedValueOnce({ statusCode: 500, data: null })
    await expect(store.updateEvent(event)).rejects.toThrow('Erreur lors de la mise à jour de l\'événement')
  })

  it('deletes an event and refreshes contacts', async () => {
    const store = useDossierStore()
    store.$patch({
      dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] },
      events: [event],
      contacts: [contact]
    })
    mocks.fetch
      .mockResolvedValueOnce({ statusCode: 204 })
      .mockResolvedValueOnce({ statusCode: 200, data: [] })

    await store.deleteEvent(event)

    expect(mocks.fetch).toHaveBeenNthCalledWith(1, '/api/students/o123456789/dossier/42/evenements/0', { method: 'DELETE' })
    expect(store.events).toEqual([])
    expect(store.contacts).toEqual([])
  })

  it('rejects unsuccessful event deletion', async () => {
    const store = useDossierStore()
    store.$patch({ dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] } })
    mocks.fetch.mockResolvedValueOnce({ statusCode: 500, message: 'Not deleted' })

    await expect(store.deleteEvent(event)).rejects.toThrow('Not deleted')
  })

  it('updates and deletes contacts across the store and events', () => {
    const store = useDossierStore()
    const eventWithContact = { ...event, contacts: [{ ...contact }] }
    store.$patch({ contacts: [contact], events: [eventWithContact] })

    store.updateContacts({ ...contact, nom: 'Martin', prenom: 'Marie', email: null })

    expect(store.contacts[0]).toMatchObject({ nom: 'Martin', prenom: 'Marie', email: '' })
    expect(store.events[0]?.contacts?.[0]).toMatchObject({ nom: 'Martin', prenom: 'Marie' })

    store.deleteContact(contact.idContact)
    expect(store.contacts).toEqual([])
    expect(store.events[0]?.contacts).toEqual([])
  })

  it('rejects updating an unknown contact and supports creating contacts', () => {
    const store = useDossierStore()

    expect(() => store.updateContacts({ ...contact })).toThrow('No contact found for ID 1')
    store.createContact(contact)
    expect(store.contacts).toEqual([contact])
  })

  it('fetches contacts, returns an empty list without data, and orders events', async () => {
    const store = useDossierStore()
    store.$patch({
      dossier: { ...dossierResponse, DemarcheEvenement: [], DepartementTagRecherche: [] },
      events: [
        { ...event, idDemarche: 1, date: '01/11/2026' },
        { ...event, idDemarche: 2, date: '08/11/2026' }
      ]
    })
    mocks.fetch.mockResolvedValueOnce({ statusCode: 200 })

    await expect(store.fetchContacts()).resolves.toEqual([])
    store.orderEvents()
    expect(store.events.map(item => item.idDemarche)).toEqual([2, 1])
  })
})
