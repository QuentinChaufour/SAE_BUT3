import { UButton, UForm, UFormField, UInput, UModal } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockUserSession, mountWithUApp, resetNuxtMocks, type Wrapper } from '../../../utils/utils'
import UserRole from '~~/shared/types/role'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  userSession: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useUserSession', () => mocks.userSession)
mockNuxtImport('useToast', () => () => mocks.toast)

const createdSearch = { idDepartement: 1, nom: 'Informatique', anneeActuelle: '2026-2027' }

async function mountAndOpen() {
  const wrapper = await mountWithUApp(DepartmentModal)
  const modal = wrapper.findComponent(UModal)

  await wrapper.findComponent({ name: 'UButton' }).trigger('click')
  await vi.waitFor(() => {
    expect(modal.props('open')).toBe(true)
    expect(wrapper.findAllComponents(UFormField).length).toBeGreaterThan(0)
  })

  return { wrapper, modal }
}

async function fillForm(wrapper: Wrapper) {
  await wrapper.findComponent(UInput).find('input').setValue('Informatique')
  await nextTick()
}

describe('DepartmentModal', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
    mockUserSession(mocks.userSession, {
      numId: 'p123456789',
      role: UserRole.Admin,
      nom: 'Nom',
      prenom: 'Prénom'
    })
  })

  it('check content', async () => {
    const wrapper = await mountWithUApp(DepartmentModal)

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
    const nomLabels = ['Nom']

    expect(forms.length).toBe(nomLabels.length)
    for (let i = 0; i < forms.length; i++) {
      expect(forms[i]!.props('label')).toBe(nomLabels[i])
    }

    const createButton = modal.findAllComponents(UButton).find(button => button.text() === 'Créer')
    expect(createButton).toBeDefined()
  })

  it('check body request', async () => {
    mocks.fetch.mockResolvedValueOnce(createdSearch)
    const { wrapper } = await mountAndOpen()

    await fillForm(wrapper)
    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/departments', {
        method: 'POST',
        body: { nom: 'Informatique' }
      })
    })
  })

  it('check loading state', async () => {
    let resolveRequest!: (value: unknown) => void
    mocks.fetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveRequest = resolve
    }))
    const { wrapper, modal } = await mountAndOpen()

    const getCreateButton = () => modal.findAllComponents(UButton).find(b => b.text() === 'Créer')!
    expect(getCreateButton().props('loading')).toBe(false)

    wrapper.findComponent(UForm).vm.$emit('submit')
    await nextTick()
    expect(getCreateButton().props('loading')).toBe(true)

    resolveRequest(createdSearch)
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(modal.props('open')).toBe(false))

    await wrapper.findComponent({ name: 'UButton' }).trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.findAllComponents(UFormField).length).toBe(1)
    })

    expect(getCreateButton().props('loading')).toBe(false)
  })

  it('show toast on success', async () => {
    mocks.fetch.mockResolvedValueOnce(createdSearch)
    const { wrapper, modal } = await mountAndOpen()

    await fillForm(wrapper)
    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Département créé',
        description: 'Le département Informatique a été créé avec succès.',
        color: 'success',
        duration: 7_000,
        actions: [{
          color: 'neutral',
          icon: 'i-lucide-users',
          label: 'Ajouter une personne aux secrétariats',
          onClick: expect.any(Function),
          variant: 'outline'
        }]
      })
    })
    expect(mocks.toast.add).toHaveBeenCalledTimes(1)

    const emitted = wrapper.findComponent(DepartmentModal).emitted('saved')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([createdSearch])

    await vi.waitFor(() => expect(modal.props('open')).toBe(false))

    await wrapper.findComponent({ name: 'UButton' }).trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.findAllComponents(UFormField).length).toBe(1)
    })

    expect(wrapper.findComponent(UInput).find('input').element.value).toBe('')
  })

  it('show error toast on failure', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { wrapper, modal } = await mountAndOpen()

    await fillForm(wrapper)
    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Impossible de créer le département.',
        color: 'error'
      })
    })

    expect(mocks.toast.add).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(DepartmentModal).emitted('saved')).toBeUndefined()

    expect(modal.props('open')).toBe(true)
    expect(wrapper.findComponent(UInput).find('input').element.value).toBe('Informatique')

    const createButton = modal.findAllComponents(UButton).find(b => b.text() === 'Créer')!
    expect(createButton.props('loading')).toBe(false)
  })

  describe('edit props on', () => {
    const editDepartment = { idDepartement: 1, nom: 'Informatique', anneeActuelle: '2026-2027' }
    const updatedDepartment = { idDepartement: 1, nom: 'Chimie', anneeActuelle: '2026-2027' }

    async function mountAndOpenEdit(dept = editDepartment) {
      const wrapper = await mountWithUApp(DepartmentModal, {
        open: true,
        editDepartment: dept
      })
      const modal = wrapper.findComponent(UModal)

      await vi.waitFor(() => {
        expect(modal.props('open')).toBe(true)
        expect(wrapper.findAllComponents(UFormField).length).toBeGreaterThan(0)
      })

      return { wrapper, modal }
    }

    it('check edit content and pre-filled value', async () => {
      const { wrapper, modal } = await mountAndOpenEdit()

      const buttons = wrapper.findAllComponents(UButton)
      expect(buttons.some(b => b.text() === 'Ajouter')).toBe(false)

      expect(modal.props('title')).toBe('Modification du département Informatique')

      const input = wrapper.findComponent(UInput).find('input')
      expect(input.element.value).toBe('Informatique')

      const saveButton = modal.findAllComponents(UButton).find(b => b.text() === 'Modifier')
      expect(saveButton).toBeDefined()
    })

    it('check body request', async () => {
      mocks.fetch.mockResolvedValueOnce(updatedDepartment)
      const { wrapper } = await mountAndOpenEdit()

      await wrapper.findComponent(UInput).find('input').setValue('Chimie')
      await nextTick()

      wrapper.findComponent(UForm).vm.$emit('submit')

      await vi.waitFor(() => {
        expect(mocks.fetch).toHaveBeenCalledWith('/api/departments/1', {
          method: 'PATCH',
          body: { nom: 'Chimie' }
        })
      })
    })

    it('check loading state when editing', async () => {
      let resolveRequest!: (value: unknown) => void
      mocks.fetch.mockReturnValueOnce(new Promise((resolve) => {
        resolveRequest = resolve
      }))
      const { wrapper, modal } = await mountAndOpenEdit()

      const getSaveButton = () => modal.findAllComponents(UButton).find(b => b.text() === 'Modifier')!
      expect(getSaveButton().props('loading')).toBe(false)

      wrapper.findComponent(UForm).vm.$emit('submit')
      await nextTick()
      expect(getSaveButton().props('loading')).toBe(true)

      resolveRequest(updatedDepartment)
      await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalledTimes(1))
      await vi.waitFor(() => expect(modal.props('open')).toBe(false))
    })

    it('show toast on edit success', async () => {
      mocks.fetch.mockResolvedValueOnce(updatedDepartment)
      const { wrapper, modal } = await mountAndOpenEdit()

      await wrapper.findComponent(UInput).find('input').setValue('Chimie')
      await nextTick()

      wrapper.findComponent(UForm).vm.$emit('submit')

      await vi.waitFor(() => {
        expect(mocks.toast.add).toHaveBeenCalledWith({
          title: 'Département mis à jour',
          description: 'Le département Chimie a été mis à jour avec succès.',
          color: 'success',
          actions: [],
          duration: 5_000
        })
      })
      expect(mocks.toast.add).toHaveBeenCalledTimes(1)

      const emitted = wrapper.findComponent(DepartmentModal).emitted('saved')
      expect(emitted).toHaveLength(1)
      expect(emitted![0]).toEqual([updatedDepartment])

      await vi.waitFor(() => expect(modal.props('open')).toBe(false))
    })

    it('show error toast on edit failure', async () => {
      mocks.fetch.mockRejectedValueOnce(new Error('Network error'))
      const { wrapper, modal } = await mountAndOpenEdit()

      await wrapper.findComponent(UInput).find('input').setValue('Chimie')
      await nextTick()

      wrapper.findComponent(UForm).vm.$emit('submit')

      await vi.waitFor(() => {
        expect(mocks.toast.add).toHaveBeenCalledWith({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le département.',
          color: 'error'
        })
      })

      expect(mocks.toast.add).toHaveBeenCalledTimes(1)
      expect(wrapper.findComponent(DepartmentModal).emitted('saved')).toBeUndefined()

      expect(modal.props('open')).toBe(true)
      expect(wrapper.findComponent(UInput).find('input').element.value).toBe('Chimie')

      const saveButton = modal.findAllComponents(UButton).find(b => b.text() === 'Modifier')!
      expect(saveButton.props('loading')).toBe(false)
    })
  })
})
