import { UButton, UForm, UFormField, UInput, UModal } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockUserSession, mountWithUApp, resetNuxtMocks } from '../../../utils/utils'
import UserRole from '~~/shared/types/role'
import PersonnelEditModal from '~/components/personnels/PersonnelEditModal.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  userSession: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useUserSession', () => mocks.userSession)
mockNuxtImport('useToast', () => () => mocks.toast)

const editPersonnel = { numPersonnel: 'p1234', prenom: 'Pierre', nom: 'Chabrier', email: 'pierre.chabrier@mail.com', role: UserRole.Admin }
const updatedPersonnel = { numPersonnel: 'p1234', prenom: 'Pierre', nom: 'Dupont', email: '', role: UserRole.Admin }

async function mountAndOpenEdit(personnel = editPersonnel) {
  const wrapper = await mountWithUApp(PersonnelEditModal, {
    open: true,
    editPersonnel: personnel
  })
  const modal = wrapper.findComponent(UModal)

  await vi.waitFor(() => {
    expect(modal.props('open')).toBe(true)
    expect(wrapper.findAllComponents(UFormField).length).toBe(3)
  })

  return { wrapper, modal }
}

describe('PersonnelEditModal', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
    mockUserSession(mocks.userSession, {
      numId: 'p123456789',
      role: UserRole.Admin,
      nom: 'Nom',
      prenom: 'Prénom'
    })
  })

  it('check content and pre-filled value', async () => {
    const { wrapper, modal } = await mountAndOpenEdit()

    expect(modal.props('title')).toBe('Modification du personnel Chabrier Pierre')

    const inputs = wrapper.findAllComponents(UInput)
    expect(inputs[0]!.find('input').element.value).toBe('Chabrier')
    expect(inputs[1]!.find('input').element.value).toBe('Pierre')
    expect(inputs[2]!.find('input').element.value).toBe('pierre.chabrier@mail.com')

    const saveButton = modal.findAllComponents(UButton).find(b => b.text() === 'Modifier')
    expect(saveButton).toBeDefined()
  })

  it('check body request', async () => {
    mocks.fetch.mockResolvedValueOnce(updatedPersonnel)
    const { wrapper } = await mountAndOpenEdit()

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('Dupont')
    await inputs[1]!.find('input').setValue('Jacques')
    await inputs[2]!.find('input').setValue('jacques.dupont@mail.com')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels/p1234', {
        method: 'PATCH',
        body: { nom: 'Dupont', prenom: 'Jacques', email: 'jacques.dupont@mail.com' }
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

    resolveRequest(updatedPersonnel)
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalledTimes(1))
    await vi.waitFor(() => expect(modal.props('open')).toBe(false))
  })

  it('show toast on edit success', async () => {
    mocks.fetch.mockResolvedValueOnce(updatedPersonnel)
    const { wrapper, modal } = await mountAndOpenEdit()

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('Dupont')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Personnel mis à jour',
        description: 'Le personnel Pierre Dupont a été mis à jour avec succès.',
        color: 'success'
      })
    })
    expect(mocks.toast.add).toHaveBeenCalledTimes(1)

    const emitted = wrapper.findComponent(PersonnelEditModal).emitted('saved')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([updatedPersonnel])

    await vi.waitFor(() => expect(modal.props('open')).toBe(false))
  })

  it('show error toast on edit failure', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))
    const { wrapper, modal } = await mountAndOpenEdit()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le personnel.',
        color: 'error'
      })
    })

    expect(mocks.toast.add).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(PersonnelEditModal).emitted('saved')).toBeUndefined()
    expect(modal.props('open')).toBe(true)

    const saveButton = modal.findAllComponents(UButton).find(b => b.text() === 'Modifier')!
    expect(saveButton.props('loading')).toBe(false)
  })

  it('disables save button and displays validation message when form is invalid', async () => {
    const { wrapper, modal } = await mountAndOpenEdit()

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('A')
    await nextTick()

    const saveButton = modal.findAllComponents(UButton).find(b => b.text() === 'Modifier')!
    expect(saveButton.props('disabled')).toBe(true)

    const tooltip = modal.findComponent({ name: 'UTooltip' })
    expect(tooltip.props('text')).toBe('Le nom est requis.')
  })

  it('resets form state when modal open is updated to false', async () => {
    const { wrapper, modal } = await mountAndOpenEdit()

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('NouveauNom')
    await inputs[1]!.find('input').setValue('NouveauPrenom')
    await nextTick()

    modal.vm.$emit('update:open', true)
    await nextTick()

    expect(inputs[0]!.find('input').element.value).toBe('NouveauNom')
    expect(inputs[1]!.find('input').element.value).toBe('NouveauPrenom')

    modal.vm.$emit('update:open', false)
    await nextTick()

    expect(inputs[0]!.find('input').element.value).toBe(editPersonnel.nom)
    expect(inputs[1]!.find('input').element.value).toBe(editPersonnel.prenom)
  })
})
