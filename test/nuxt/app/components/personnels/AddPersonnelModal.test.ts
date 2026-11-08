import { UAlert, UButton, UForm, UFormField, UInput, UModal, UTooltip } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { FetchError } from 'ofetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AddPersonnelModal from '~/components/personnels/AddPersonnelModal.vue'
import PersonnelInput from '~/components/personnels/PersonnelInput.vue'
import { mockUserSession, mountWithUApp, resetNuxtMocks } from '../../../utils/utils'
import UserRole from '~~/shared/types/role'
import type { Departement } from '~~/generated/prisma/client'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  userSession: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useUserSession', () => mocks.userSession)
mockNuxtImport('useToast', () => () => mocks.toast)

const mockDepartment: Departement = {
  idDepartement: 1,
  nom: 'Informatique',
  anneeActuelle: '2026-2027'
}

async function mountAndOpen(type: 'admin' | 'secretariat', department = mockDepartment) {
  const props: { type: 'admin' | 'secretariat', department?: Departement } = { type }
  if (type === 'secretariat') props.department = department

  const wrapper = await mountWithUApp(AddPersonnelModal, { ...props, open: true })
  const modal = wrapper.findComponent(UModal)

  await vi.waitFor(() => {
    expect(modal.props('open')).toBe(true)
    expect(wrapper.findAllComponents(UFormField).length).toBe(4)
  })

  return { wrapper, modal }
}

describe('AddPersonnelModal', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
    mockUserSession(mocks.userSession, {
      numId: 'p123456789',
      role: UserRole.Admin,
      nom: 'Nom',
      prenom: 'Prénom'
    })
  })

  it('renders closed by default with trigger button', async () => {
    const wrapper = await mountWithUApp(AddPersonnelModal, { type: 'admin' })
    const modal = wrapper.findComponent(UModal)
    const triggerButton = wrapper.findComponent({ name: 'UButton' })

    expect(modal.props('open')).toBe(false)
    expect(triggerButton.exists()).toBe(true)
    expect(triggerButton.text()).toBe('Ajouter')
    expect(triggerButton.props('icon')).toBe('i-lucide-plus')
  })

  it('renders admin modal structure and fields', async () => {
    const { wrapper, modal } = await mountAndOpen('admin')

    expect(modal.props('title')).toBe('Ajout d\'un administrateur')

    const formFields = wrapper.findAllComponents(UFormField)
    expect(formFields).toHaveLength(4)
    expect(formFields[0]!.props('label')).toBe('Numéro du personnel')
    expect(formFields[0]!.props('help')).toBeUndefined()
    expect(formFields[1]!.props('label')).toBe('Nom')
    expect(formFields[2]!.props('label')).toBe('Prénom')
    expect(formFields[3]!.props('label')).toBe('Email')

    expect(wrapper.findComponent(PersonnelInput).exists()).toBe(false)
    const inputs = wrapper.findAllComponents(UInput)
    expect(inputs).toHaveLength(4)
    expect(inputs[0]!.find('input').attributes('placeholder')).toBe('Numéro du personnel')
    expect(inputs[1]!.find('input').attributes('placeholder')).toBe('Nom')
    expect(inputs[2]!.find('input').attributes('placeholder')).toBe('Prénom')
    expect(inputs[3]!.find('input').attributes('placeholder')).toBe('Email')

    expect(wrapper.findComponent(UAlert).exists()).toBe(false)

    const submitButton = modal.findAllComponents(UButton).find(b => b.props('type') === 'submit')
    expect(submitButton).toBeDefined()
    expect(submitButton!.text()).toBe('Ajouter')
    expect(submitButton!.props('disabled')).toBe(true)
  })

  it('renders secretariat modal structure and fields', async () => {
    const { wrapper, modal } = await mountAndOpen('secretariat')

    expect(modal.props('title')).toBe('Ajout d\'un personnel du secrétariat')

    const formFields = wrapper.findAllComponents(UFormField)
    expect(formFields).toHaveLength(4)
    expect(formFields[0]!.props('label')).toBe('Numéro du personnel')
    expect(formFields[0]!.props('help')).toBe('Sélectionnez un personnel existant ou saisissez un nouveau numéro.')

    const personnelInput = wrapper.findComponent(PersonnelInput)
    expect(personnelInput.exists()).toBe(true)
    expect(personnelInput.props('role')).toBe('secretariat')

    const inputs = wrapper.findAllComponents(UInput)
    expect(inputs).toHaveLength(3)
    expect(inputs[0]!.find('input').attributes('placeholder')).toBe('Nom')
    expect(inputs[1]!.find('input').attributes('placeholder')).toBe('Prénom')
    expect(inputs[2]!.find('input').attributes('placeholder')).toBe('Email')
  })

  it('disables submit button and shows tooltip when invalid', async () => {
    const { wrapper, modal } = await mountAndOpen('admin')
    const submitButton = modal.findAllComponents(UButton).find(b => b.props('type') === 'submit')!
    const tooltip = modal.findComponent(UTooltip)

    expect(submitButton.props('disabled')).toBe(true)
    expect(tooltip.props('text')).toBeTruthy()

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('1234')
    await inputs[1]!.find('input').setValue('Dupont')
    await inputs[2]!.find('input').setValue('Jean')
    await inputs[3]!.find('input').setValue('jean.dupont@univ-orleans.fr')
    await nextTick()

    expect(submitButton.props('disabled')).toBe(true)
    expect(tooltip.props('text')).toBe('Le numéro de personnel doit commencer par "p" suivi de 1 à 12 chiffres.')

    await inputs[0]!.find('input').setValue('p1234')
    await nextTick()

    expect(submitButton.props('disabled')).toBe(false)
    expect(tooltip.props('text')).toBe('')
    expect(tooltip.props('disabled')).toBe(true)
  })

  it('resets form state when modal is reopened', async () => {
    const { wrapper, modal } = await mountAndOpen('admin')
    const inputs = wrapper.findAllComponents(UInput)

    await inputs[0]!.find('input').setValue('p1234')
    await inputs[1]!.find('input').setValue('Dupont')
    await inputs[2]!.find('input').setValue('Jean')
    await nextTick()

    modal.vm.$emit('update:open', false)
    await nextTick()

    modal.vm.$emit('update:open', true)
    await nextTick()

    const resetInputs = wrapper.findAllComponents(UInput)
    expect(resetInputs[0]!.find('input').element.value).toBe('')
    expect(resetInputs[1]!.find('input').element.value).toBe('')
    expect(resetInputs[2]!.find('input').element.value).toBe('')
  })

  it('locks nom and prenom and shows alert when selecting an existing personnel', async () => {
    const { wrapper } = await mountAndOpen('secretariat')
    const personnelInput = wrapper.findComponent(PersonnelInput)

    personnelInput.vm.$emit('select', {
      numPersonnel: 'p5678',
      nom: 'Martin',
      prenom: 'Alice',
      existing: true
    })
    await nextTick()

    const alert = wrapper.findComponent(UAlert)
    expect(alert.exists()).toBe(true)
    expect(alert.props('description')).toBe(
      'Ce personnel existe déjà, ses informations ne peuvent pas être modifiées depuis ce formulaire.'
    )

    const inputs = wrapper.findAllComponents(UInput)
    expect(inputs[0]!.find('input').element.value).toBe('Martin')
    expect((inputs[0]!.find('input').element as HTMLInputElement).disabled).toBe(true)
    expect(inputs[1]!.find('input').element.value).toBe('Alice')
    expect((inputs[1]!.find('input').element as HTMLInputElement).disabled).toBe(true)
  })

  it('allows editing nom and prenom when selecting a new personnel', async () => {
    const { wrapper } = await mountAndOpen('secretariat')
    const personnelInput = wrapper.findComponent(PersonnelInput)

    personnelInput.vm.$emit('select', {
      numPersonnel: 'p9999',
      nom: '',
      prenom: '',
      existing: false
    })
    await nextTick()

    expect(wrapper.findComponent(UAlert).exists()).toBe(false)
    const inputs = wrapper.findAllComponents(UInput)
    expect((inputs[0]!.find('input').element as HTMLInputElement).disabled).toBe(false)
    expect((inputs[1]!.find('input').element as HTMLInputElement).disabled).toBe(false)
  })

  it('handles null selection properly', async () => {
    const { wrapper } = await mountAndOpen('secretariat')
    const personnelInput = wrapper.findComponent(PersonnelInput)

    personnelInput.vm.$emit('select', {
      numPersonnel: 'p5678',
      nom: 'Martin',
      prenom: 'Alice',
      existing: true
    })
    await nextTick()
    expect(wrapper.findComponent(UAlert).exists()).toBe(true)

    personnelInput.vm.$emit('select', null)
    await nextTick()

    expect(wrapper.findComponent(UAlert).exists()).toBe(false)
    const inputs = wrapper.findAllComponents(UInput)
    expect(inputs[0]!.find('input').element.value).toBe('')
    expect(inputs[1]!.find('input').element.value).toBe('')
    expect((inputs[0]!.find('input').element as HTMLInputElement).disabled).toBe(false)
    expect((inputs[1]!.find('input').element as HTMLInputElement).disabled).toBe(false)
  })

  it('submits form with correct payload, emits created and shows toast', async () => {
    mocks.fetch.mockResolvedValueOnce({
      numPersonnel: 'p1234',
      nom: 'Dupont',
      prenom: 'Jean',
      role: 'admin',
      email: 'jean.dupont@univ-orleans.fr'
    })

    const { wrapper, modal } = await mountAndOpen('admin')
    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('p1234')
    await inputs[1]!.find('input').setValue('Dupont')
    await inputs[2]!.find('input').setValue('Jean')
    await inputs[3]!.find('input').setValue('jean.dupont@univ-orleans.fr')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels', {
        method: 'POST',
        body: {
          numPersonnel: 'p1234',
          nom: 'Dupont',
          prenom: 'Jean',
          role: 'admin',
          email: 'jean.dupont@univ-orleans.fr',
          department_ids: undefined
        }
      })
    })

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Personnel ajouté',
        description: 'Jean Dupont a été ajouté comme administrateur.',
        color: 'success'
      })
    })

    const emitted = wrapper.findComponent(AddPersonnelModal).emitted('created')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([{
      numPersonnel: 'p1234',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@univ-orleans.fr'
    }])

    await vi.waitFor(() => {
      expect(modal.props('open')).toBe(false)
    })
  })

  it('submits new personnel to /api/personnels with department_ids', async () => {
    mocks.fetch.mockResolvedValueOnce({
      numPersonnel: 'p4321',
      nom: 'Durand',
      prenom: 'Claire',
      email: 'claire.durand@univ-orleans.fr',
      role: 'secretariat'
    })

    const { wrapper, modal } = await mountAndOpen('secretariat')
    const personnelInput = wrapper.findComponent(PersonnelInput)
    personnelInput.vm.$emit('update:modelValue', 'p4321')
    personnelInput.vm.$emit('select', {
      numPersonnel: 'p4321',
      nom: 'Durand',
      prenom: 'Claire',
      email: 'claire.durand@univ-orleans.fr',
      existing: false
    })

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('Durand')
    await inputs[1]!.find('input').setValue('Claire')
    await inputs[2]!.find('input').setValue('claire.durand@univ-orleans.fr')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels', {
        method: 'POST',
        body: {
          numPersonnel: 'p4321',
          nom: 'Durand',
          prenom: 'Claire',
          email: 'claire.durand@univ-orleans.fr',
          role: 'secretariat',
          department_ids: [1]
        }
      })
    })

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Personnel ajouté',
        description: 'Claire Durand a été ajouté au département Informatique.',
        color: 'success'
      })
    })

    const emitted = wrapper.findComponent(AddPersonnelModal).emitted('created')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([{
      numPersonnel: 'p4321',
      nom: 'Durand',
      prenom: 'Claire',
      email: 'claire.durand@univ-orleans.fr'
    }])

    await vi.waitFor(() => {
      expect(modal.props('open')).toBe(false)
    })
  })

  it('submits new personnel to /api/personnels with no email', async () => {
    mocks.fetch.mockResolvedValueOnce({
      numPersonnel: 'p4321',
      nom: 'Durand',
      prenom: 'Claire',
      email: '',
      role: 'secretariat'
    })

    const { wrapper, modal } = await mountAndOpen('secretariat')
    const personnelInput = wrapper.findComponent(PersonnelInput)
    personnelInput.vm.$emit('update:modelValue', 'p4321')
    personnelInput.vm.$emit('select', {
      numPersonnel: 'p4321',
      nom: 'Durand',
      prenom: 'Claire',
      email: '',
      existing: false
    })

    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('Durand')
    await inputs[1]!.find('input').setValue('Claire')
    await inputs[2]!.find('input').setValue('')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels', {
        method: 'POST',
        body: {
          numPersonnel: 'p4321',
          nom: 'Durand',
          prenom: 'Claire',
          email: null,
          role: 'secretariat',
          department_ids: [1]
        }
      })
    })

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Personnel ajouté',
        description: 'Claire Durand a été ajouté au département Informatique.',
        color: 'success'
      })
    })

    const emitted = wrapper.findComponent(AddPersonnelModal).emitted('created')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([{
      numPersonnel: 'p4321',
      nom: 'Durand',
      prenom: 'Claire',
      email: ''
    }])

    await vi.waitFor(() => {
      expect(modal.props('open')).toBe(false)
    })
  })

  it('submits existing personnel to /api/personnels/:id/departments', async () => {
    mocks.fetch.mockResolvedValueOnce(undefined)

    const { wrapper, modal } = await mountAndOpen('secretariat')
    const personnelInput = wrapper.findComponent(PersonnelInput)
    personnelInput.vm.$emit('update:modelValue', 'p5678')
    personnelInput.vm.$emit('select', {
      numPersonnel: 'p5678',
      nom: 'Martin',
      prenom: 'Alice',
      email: 'alice.martin@univ-orleans.fr',
      existing: true
    })
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels/p5678/departments', {
        method: 'POST',
        body: { departement_id: 1 }
      })
    })

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Personnel ajouté',
        description: 'Alice Martin a été ajouté au département Informatique.',
        color: 'success'
      })
    })

    const emitted = wrapper.findComponent(AddPersonnelModal).emitted('created')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([{
      numPersonnel: 'p5678',
      nom: 'Martin',
      prenom: 'Alice',
      email: 'alice.martin@univ-orleans.fr'
    }])

    await vi.waitFor(() => expect(modal.props('open')).toBe(false))
  })

  it('check network error', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    const { wrapper, modal } = await mountAndOpen('admin')
    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('p1234')
    await inputs[1]!.find('input').setValue('Dupont')
    await inputs[2]!.find('input').setValue('Jean')
    await inputs[3]!.find('input').setValue('jean.dupont@univ-orleans.fr')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'ajout du personnel.',
        color: 'error'
      })
    })

    expect(wrapper.findComponent(AddPersonnelModal).emitted('created')).toBeUndefined()
    expect(modal.props('open')).toBe(true)

    const submitButton = modal.findAllComponents(UButton).find(b => b.props('type') === 'submit')!
    expect(submitButton.props('loading')).toBe(false)
  })

  it('handles 409 conflict error when numPersonnel already exists', async () => {
    const conflictError = new FetchError('Conflict')
    conflictError.response = { status: 409 } as unknown as FetchError['response']

    mocks.fetch.mockRejectedValueOnce(conflictError)

    const { wrapper, modal } = await mountAndOpen('admin')
    const inputs = wrapper.findAllComponents(UInput)
    await inputs[0]!.find('input').setValue('p1234')
    await inputs[1]!.find('input').setValue('Dupont')
    await inputs[2]!.find('input').setValue('Jean')
    await inputs[3]!.find('input').setValue('jean.dupont@univ-orleans.fr')
    await nextTick()

    wrapper.findComponent(UForm).vm.$emit('submit')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Le numéro de personnel donné existe déjà.',
        color: 'error'
      })
    })

    expect(wrapper.findComponent(AddPersonnelModal).emitted('created')).toBeUndefined()
    expect(modal.props('open')).toBe(true)

    const submitButton = modal.findAllComponents(UButton).find(b => b.props('type') === 'submit')!
    expect(submitButton.props('loading')).toBe(false)
  })
})
