import { UButton, UForm, UInput } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactForm from '~/components/forms/ContactForm.vue'
import { mountWithUApp, resetNuxtMocks } from '../../../utils/utils'
import type { DemarcheContact } from '~~/generated/prisma/client'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)
mockNuxtImport('useUserSession', () => () => ({
  user: { value: { numId: 'o123456789' } }
}))

const contact: DemarcheContact = {
  idContact: 7,
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  telephone: '0600000000',
  fonction: 'Responsable',
  idRecherche: 12
}

const createdContact = { ...contact, idContact: 8 }
const confirmMock = vi.fn()
vi.stubGlobal('confirm', confirmMock)

describe('ContactForm', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
    confirmMock.mockReset()
  })

  it('initializes create mode with state and create/cancel actions', async () => {
    const wrapper = await mountWithUApp(ContactForm, {
      create: true,
      dossierId: 12,
      state: { nom: 'Martin', fonction: 'RH' }
    })
    const form = wrapper.findComponent(UForm)

    expect(form.props()).toMatchObject({
      state: {
        idContact: null,
        nom: 'Martin',
        prenom: '',
        email: '',
        telephone: '',
        fonction: 'RH',
        idRecherche: 12
      }
    })
    expect(wrapper.findAllComponents(UButton).map(button => button.text())).toEqual(['Annuler', 'Créer'])
  })

  it('initializes update mode from the contact and renders update/delete actions', async () => {
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })
    const form = wrapper.findComponent(UForm)

    expect(form.props()).toMatchObject({ state: contact })
    expect(wrapper.findAllComponents(UButton).map(button => button.text())).toEqual(['Supprimer', 'Modifier'])
  })

  it('updates state when each contact field is edited', async () => {
    const wrapper = await mountWithUApp(ContactForm, { create: true, dossierId: 12 })
    const inputs = wrapper.findAllComponents(UInput)

    await inputs[0]!.find('input').setValue('Martin')
    await inputs[1]!.find('input').setValue('Marie')
    await inputs[2]!.find('input').setValue('RH')
    await inputs[3]!.find('input').setValue('0612345678')
    await inputs[4]!.find('input').setValue('marie.martin@example.com')

    expect(wrapper.findComponent(UForm).props()).toMatchObject({
      state: {
        nom: 'Martin',
        prenom: 'Marie',
        fonction: 'RH',
        telephone: '0612345678',
        email: 'marie.martin@example.com'
      }
    })
  })

  it('emits cancel in create mode', async () => {
    const wrapper = await mountWithUApp(ContactForm, {
      create: true,
      dossierId: 12
    })
    const cancelButton = wrapper.findAllComponents(UButton).find(button => button.text() === 'Annuler')!

    await cancelButton.trigger('click')

    expect(wrapper.findComponent(ContactForm).emitted('cancel')).toBeTruthy()
  })

  it('creates a contact and emits the response data', async () => {
    mocks.fetch.mockResolvedValueOnce({ statusCode: 201, data: createdContact })
    const wrapper = await mountWithUApp(ContactForm, { create: true, dossierId: 12 })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalled())

    expect(mocks.fetch).toHaveBeenCalledWith('/api/students/o123456789/dossier/12/contacts', {
      method: 'POST',
      body: expect.objectContaining({ idRecherche: 12 })
    })
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Succès',
      description: 'Le contact a été créé avec succès.'
    })
    expect(wrapper.findComponent(ContactForm).emitted('created')).toEqual([[createdContact]])
  })

  it.each([
    ['without response data', { statusCode: 201 }],
    ['with an unexpected status', { statusCode: 200, data: createdContact }]
  ])('shows an error when creation is rejected %s', async (_reason, response) => {
    const wrapper = await mountWithUApp(ContactForm, { create: true, dossierId: 12 })
    mocks.fetch.mockResolvedValueOnce(response)

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalled())

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la création du contact.'
    })
    expect(wrapper.findComponent(ContactForm).emitted('created')).toBeUndefined()
  })

  it('shows an error when contact creation fails', async () => {
    const wrapper = await mountWithUApp(ContactForm, { create: true, dossierId: 12 })
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalled())

    expect(wrapper.findComponent(ContactForm).emitted('created')).toBeUndefined()
  })

  it('updates a contact and emits the response data', async () => {
    mocks.fetch.mockResolvedValueOnce({ statusCode: 200, data: contact })
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalled())

    expect(mocks.fetch).toHaveBeenCalledWith('/api/students/o123456789/dossier/12/contacts/7', {
      method: 'PATCH',
      body: contact
    })
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Succès',
      description: 'Le contact a été mis à jour avec succès.'
    })
    expect(wrapper.findComponent(ContactForm).emitted('updated')).toEqual([[contact]])
  })

  it.each([
    ['without response data', { statusCode: 200 }],
    ['with an unexpected status', { statusCode: 201, data: contact }]
  ])('shows an error when update is rejected %s', async (_reason, response) => {
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })
    mocks.fetch.mockResolvedValueOnce(response)

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalled())

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la mise à jour du contact.'
    })
    expect(wrapper.findComponent(ContactForm).emitted('updated')).toBeUndefined()
  })

  it('does not delete a contact when confirmation is canceled', async () => {
    confirmMock.mockReturnValue(false)
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })

    await wrapper.findAllComponents(UButton).find(button => button.text() === 'Supprimer')!.trigger('click')

    expect(confirmMock).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.')
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('deletes a contact after confirmation and emits deleted', async () => {
    confirmMock.mockReturnValue(true)
    mocks.fetch.mockResolvedValueOnce({ statusCode: 204, data: null })
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })

    await wrapper.findAllComponents(UButton).find(button => button.text() === 'Supprimer')!.trigger('click')
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalled())

    expect(mocks.fetch).toHaveBeenCalledWith('/api/students/o123456789/dossier/12/contacts/7', { method: 'DELETE' })
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Succès',
      description: 'Le contact a été supprimé avec succès.'
    })
    expect(wrapper.findComponent(ContactForm).emitted('deleted')).toBeTruthy()
  })

  it('shows an error when deletion returns an unexpected status', async () => {
    confirmMock.mockReturnValue(true)
    mocks.fetch.mockResolvedValueOnce({ statusCode: 200, data: null })
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })

    await wrapper.findAllComponents(UButton).find(button => button.text() === 'Supprimer')!.trigger('click')
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalled())

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la suppression du contact.'
    })
    expect(wrapper.findComponent(ContactForm).emitted('deleted')).toBeUndefined()
  })

  it('shows an error when deletion fails', async () => {
    confirmMock.mockReturnValue(true)
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = await mountWithUApp(ContactForm, { update: true, dossierId: 12, contact })

    await wrapper.findAllComponents(UButton).find(button => button.text() === 'Supprimer')!.trigger('click')
    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalled())

    expect(wrapper.findComponent(ContactForm).emitted('deleted')).toBeUndefined()
  })
})
