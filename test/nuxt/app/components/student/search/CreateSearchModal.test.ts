import { UApp, UButton, UCheckbox, UForm, UFormField, UInput, UModal, UTextarea } from '#components'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SelectCompanyInput from '~/components/companies/SelectCompanyInput.vue'
import CreateSearchModal from '~/components/student/search/CreateSearchModal.vue'

const CreateSearchModalComponent = defineComponent({
  setup() {
    return () => h(UApp, null, { default: () => h(CreateSearchModal) })
  }
})

const mockFetch = vi.hoisted(() => vi.fn())
mockNuxtImport('$fetch', () => mockFetch)

const mockToast = vi.hoisted(() => ({ add: vi.fn() }))
mockNuxtImport('useToast', () => () => mockToast)

const createdSearch = { idRecherche: 1, titre: 'Stage développeur', numEtu: 'o123456789' }

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

async function mountAndOpen() {
  const wrapper = await mountSuspended(CreateSearchModalComponent)
  const modal = wrapper.findComponent(UModal)

  await wrapper.findComponent({ name: 'UButton' }).trigger('click')
  await vi.waitFor(() => {
    expect(modal.props('open')).toBe(true)
    expect(wrapper.findAllComponents(UFormField).length).toBeGreaterThan(0)
  })

  return { wrapper, modal }
}

async function fillForm(wrapper: Wrapper) {
  wrapper.findComponent(SelectCompanyInput).vm.$emit('update:idEntreprise', 42)

  await wrapper.findComponent(UInput).find('input').setValue('Stage développeur')
  await wrapper.findComponent(UTextarea).find('textarea').setValue('Une description')
  wrapper.findComponent(UCheckbox).vm.$emit('update:modelValue', true)

  await nextTick()
}

describe('CreateSearchModal', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockToast.add.mockClear()
  })

  it('check content', async () => {
    const wrapper = await mountSuspended(CreateSearchModalComponent)

    const button = wrapper.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Ajouter')

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(false)

    await button.trigger('click')
    await vi.waitFor(() => {
      expect(modal.props('open')).toBe(true)
      expect(wrapper.findAllComponents(UFormField).length).toBeGreaterThan(0)
    })

    const forms = wrapper.findAllComponents(UFormField)
    const nomLabels = ['Entreprise', 'Titre', 'Description', 'Alternance']

    expect(forms.length).toBe(nomLabels.length)
    for (let i = 0; i < forms.length; i++) {
      expect(forms[i]!.props('label')).toBe(nomLabels[i])
    }

    const createButton = modal.findAllComponents(UButton).find(button => button.text() === 'Créer')
    expect(createButton).toBeDefined()
  })

  it('check body request', async () => {
    mockFetch.mockResolvedValueOnce(createdSearch)
    const { wrapper } = await mountAndOpen()

    await fillForm(wrapper)
    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/students/o123456789/search', {
        method: 'POST',
        body: {
          titre: 'Stage développeur',
          description: 'Une description',
          alternance: true,
          idEntreprise: 42,
          annee: '2026'
        }
      })
    })
  })

  it('check loading state', async () => {
    let resolveRequest!: (value: unknown) => void
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveRequest = resolve
    }))
    const { wrapper, modal } = await mountAndOpen()

    const getCreateButton = () => modal.findAllComponents(UButton).find(b => b.text() === 'Créer')!
    expect(getCreateButton().props('loading')).toBe(false)

    wrapper.findComponent(UForm).vm.$emit('submit')
    await nextTick()
    expect(getCreateButton().props('loading')).toBe(true)

    resolveRequest(createdSearch)
    await vi.waitFor(() => expect(mockToast.add).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(modal.props('open')).toBe(false))

    await wrapper.findComponent({ name: 'UButton' }).trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.findAllComponents(UFormField).length).toBe(4)
    })

    expect(getCreateButton().props('loading')).toBe(false)
  })

  it('show toast on success', async () => {
    mockFetch.mockResolvedValueOnce(createdSearch)
    const { wrapper, modal } = await mountAndOpen()

    await fillForm(wrapper)
    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Recherche créée',
        description: 'Votre recherche a été créée avec succès.',
        color: 'success'
      })
    })
    expect(mockToast.add).toHaveBeenCalledTimes(1)

    const emitted = wrapper.findComponent(CreateSearchModal).emitted('created')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([createdSearch])

    await vi.waitFor(() => expect(modal.props('open')).toBe(false))

    await wrapper.findComponent({ name: 'UButton' }).trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.findAllComponents(UFormField).length).toBe(4)
    })

    expect(wrapper.findComponent(UInput).find('input').element.value).toBe('')
    expect(wrapper.findComponent(UTextarea).find('textarea').element.value).toBe('')
    expect(wrapper.findComponent(UCheckbox).find('button').attributes('aria-checked')).toBe('false')
    expect(wrapper.findComponent(SelectCompanyInput).props('idEntreprise')).toBeUndefined()
  })

  it('show error toast on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { wrapper, modal } = await mountAndOpen()

    await fillForm(wrapper)
    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mockToast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Impossible de créer votre recherche.',
        color: 'error'
      })
    })

    expect(mockToast.add).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(CreateSearchModal).emitted('created')).toBeUndefined()

    expect(modal.props('open')).toBe(true)
    expect(wrapper.findComponent(UInput).find('input').element.value).toBe('Stage développeur')
    expect(wrapper.findComponent(UTextarea).find('textarea').element.value).toBe('Une description')
    expect(wrapper.findComponent(UCheckbox).find('button').attributes('aria-checked')).toBe('true')

    const createButton = modal.findAllComponents(UButton).find(b => b.text() === 'Créer')!
    expect(createButton.props('loading')).toBe(false)
  })
})
