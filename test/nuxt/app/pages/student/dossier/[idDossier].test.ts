import { UButton, UInput, UTextarea } from '#components'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { reactive, defineComponent, h, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DossierPage from '~/pages/student/dossier/[idDossier].vue'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'
import { withUApp } from '~~/test/nuxt/utils/utils'

const mocks = vi.hoisted(() => ({
  store: undefined as unknown as ReturnType<typeof createStore>,
  fetch: vi.fn(),
  userSession: vi.fn(),
  route: vi.fn(),
  toast: { add: vi.fn() },
  navigateTo: vi.fn(),
  showError: vi.fn()
}))

type MockDossier = {
  idRecherche: number
  titre: string
  description: string
  alternance: boolean
  Entreprise: {
    nom: string
    adresse: string
    codePostal: string
    ville: string
  }
}

function createStore() {
  return reactive({
    dossier: {
      idRecherche: 42,
      titre: 'Stage développeur',
      description: 'Recherche de stage',
      alternance: false,
      Entreprise: {
        nom: 'Acme',
        adresse: '1 rue du Test',
        codePostal: '75000',
        ville: 'Paris'
      }
    } as MockDossier | null,
    events: [{
      idDemarche: 1,
      titre: 'Candidature',
      description: 'CV envoyé',
      date: '2026-11-07',
      status: Recherche_Stage_Status.AttenteEnvoi,
      source: Demarche_Source.Email,
      contacts: []
    }],
    contacts: [],
    dossierTags: ['Java'],
    getStatus: Recherche_Stage_Status.AttenteEnvoi,
    initState: vi.fn().mockResolvedValue(undefined),
    updateDossier: vi.fn().mockResolvedValue(undefined),
    createEvent: vi.fn().mockResolvedValue(undefined),
    updateEvent: vi.fn().mockResolvedValue(undefined),
    deleteEvent: vi.fn().mockResolvedValue(undefined),
    updateContacts: vi.fn(),
    deleteContact: vi.fn()
  })
}

mockNuxtImport('useDossierStore', () => () => mocks.store)
mockNuxtImport('useUserSession', () => mocks.userSession)
mockNuxtImport('useRoute', () => mocks.route)
mockNuxtImport('useToast', () => () => mocks.toast)
mockNuxtImport('navigateTo', () => mocks.navigateTo)
mockNuxtImport('showError', () => mocks.showError)
mockNuxtImport('$fetch', () => mocks.fetch)

const EventsManagementStub = defineComponent({
  name: 'EventsManagement',
  props: {
    events: { type: Array, required: true },
    dossierId: { type: Number, required: true }
  },
  emits: ['updated', 'deleted'],
  setup: (_, { slots }) => {
    return () => h('div', [
      h('span', 'events-management'),
      slots.header_action?.()
    ])
  }
})

const EventDescriptionStub = defineComponent({
  name: 'EventDescription',
  props: {
    creation: Boolean,
    dossierId: { type: Number, required: true },
    state: Object
  },
  emits: ['created'],
  setup: () => () => h('div', 'event-description')
})

const DossierTagSelectionStub = defineComponent({
  name: 'DossierTagSelection',
  props: {
    tags: { type: Array, required: true },
    idDepartement: { type: Number, default: null },
    idDossier: { type: Number, required: true }
  },
  setup: () => () => h('div', 'tag-selection')
})

const ContactFormStub = defineComponent({
  name: 'ContactForm',
  setup: () => () => h('div', 'contact-form')
})

const ContactCardStub = defineComponent({
  name: 'ContactCard',
  setup: () => () => h('div', 'contact-card')
})

const TooltipStub = defineComponent({
  name: 'UTooltip',
  setup: (_, { slots }) => () => slots.default?.()
})

async function mountPage() {
  return mountSuspended(withUApp(DossierPage), {
    global: {
      stubs: {
        EventsManagement: EventsManagementStub,
        EventDescription: EventDescriptionStub,
        DossierTagSelection: DossierTagSelectionStub,
        ContactForm: ContactFormStub,
        ContactCard: ContactCardStub,
        UTooltip: TooltipStub
      }
    }
  })
}

describe('Student dossier page', () => {
  beforeEach(() => {
    mocks.store = createStore()
    mocks.userSession.mockReturnValue({
      user: ref({ numId: 'o123456789' })
    })
    mocks.route.mockReturnValue({ params: { idDossier: '42' } })
    mocks.fetch.mockReset()
    mocks.fetch.mockResolvedValue({
      statusCode: 200,
      data: { idDepartement: 7 }
    })
    mocks.toast.add.mockReset()
    mocks.navigateTo.mockReset()
    mocks.showError.mockReset()
  })

  it('initializes the dossier and department on mount', async () => {
    await mountPage()

    await vi.waitFor(() => expect(mocks.store.initState).toHaveBeenCalledWith(42))
    expect(mocks.fetch).toHaveBeenCalledWith('/api/students/o123456789/departement', { method: 'GET' })
  })

  it('renders dossier details and empty contact/file states', async () => {
    const wrapper = await mountPage()

    const inputs = wrapper.findAllComponents(UInput) as unknown as VueWrapper[]
    const inputValues = inputs.map(input => (input.props() as { modelValue?: string }).modelValue)
    expect(inputValues).toContain('Stage développeur')
    expect(inputValues).toContain('Acme')
    expect(inputValues).toContain('1 rue du Test')
    expect(wrapper.text()).toContain('Aucun contact au cours de la recherche.')
    expect(wrapper.text()).toContain('Aucun fichiers téléversé au cours de la recherche.')
    expect(wrapper.findComponent(EventsManagementStub).props('dossierId')).toBe(42)
    expect(wrapper.findComponent(DossierTagSelectionStub).props('idDossier')).toBe(42)
  })

  it('navigates back to the search page', async () => {
    const wrapper = await mountPage()

    await wrapper.findAllComponents(UButton).find(button => button.text() === 'Retour')!.trigger('click')

    expect(mocks.navigateTo).toHaveBeenCalledWith('/student/search')
  })

  it('updates the dossier when title or description loses focus', async () => {
    const wrapper = await mountPage()
    const inputs = wrapper.findAllComponents(UInput) as unknown as VueWrapper[]
    const description = wrapper.findComponent(UTextarea) as unknown as VueWrapper
    const title = inputs.find(input => (input.props() as { modelValue?: string }).modelValue === 'Stage développeur')!

    await title.vm.$emit('update:modelValue', 'Nouveau titre')
    await description.vm.$emit('update:modelValue', 'Nouvelle description')
    await nextTick()
    await title.find('input').trigger('blur')
    await description.find('textarea').trigger('blur')

    await vi.waitFor(() => expect(mocks.store.updateDossier).toHaveBeenCalledWith({
      titre: 'Nouveau titre',
      description: 'Nouvelle description'
    }))
  })

  it('opens event creation and creates an event through the store', async () => {
    const wrapper = await mountPage()

    await wrapper.findAllComponents(UButton).find(button => button.text() === 'Ajouter un événement')!.trigger('click')
    await nextTick()

    const eventDescription = wrapper.findComponent(EventDescriptionStub)
    expect(eventDescription.props('creation')).toBe(true)
    const createdEvent = {
      idDemarche: 0,
      titre: 'Entretien',
      description: '',
      date: '2026-11-07',
      status: Recherche_Stage_Status.Entretien,
      source: Demarche_Source.Telephone,
      contacts: []
    }
    await eventDescription.vm.$emit('created', createdEvent)

    expect(mocks.store.createEvent).toHaveBeenCalledWith(createdEvent)
  })

  it('forwards event updates and deletions to the store', async () => {
    const wrapper = await mountPage()
    const management = wrapper.findComponent(EventsManagementStub)
    const updatedEvent = { ...mocks.store.events[0], titre: 'Modifié' }

    await management.vm.$emit('updated', updatedEvent)
    await management.vm.$emit('deleted', updatedEvent)

    expect(mocks.store.updateEvent).toHaveBeenCalledWith(updatedEvent)
    expect(mocks.store.deleteEvent).toHaveBeenCalledWith(updatedEvent)
  })

  it('shows the loading state before a dossier is available', async () => {
    mocks.store.dossier = null
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Chargement du dossier...')
    expect(wrapper.text()).toContain('Retour')
  })

  it('reports dossier loading failures', async () => {
    mocks.store.initState.mockRejectedValueOnce(new Error('Network error'))

    await mountPage()

    await vi.waitFor(() => expect(mocks.showError).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      message: 'Failed to load dossier data with id 42'
    })))
  })
})
