import { UButton, UForm, UInput, UInputMenu, UTextarea } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactForm from '~/components/forms/ContactForm.vue'
import EventDescription from '~/components/dossier/EventDescription.vue'
import { mountWithUApp } from '../../../utils/utils'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'
import type { DemarcheContact } from '~~/generated/prisma/client'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const contact: DemarcheContact = {
  idContact: 7,
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@example.com',
  telephone: '0600000000',
  fonction: 'Responsable',
  idRecherche: 12
}

const secondContact: DemarcheContact = {
  ...contact,
  idContact: 8,
  nom: 'Martin',
  prenom: 'Marie'
}

const event = {
  idDemarche: 3,
  titre: 'Candidature',
  description: 'Envoi du CV',
  date: '2026-11-07',
  status: Recherche_Stage_Status.AttenteEnvoi,
  source: Demarche_Source.Email,
  contacts: [contact]
}

const confirmMock = vi.fn()
vi.stubGlobal('confirm', confirmMock)

describe('EventDescription', () => {
  beforeEach(() => {
    mocks.fetch.mockReset()
    mocks.toast.add.mockReset()
    mocks.fetch.mockResolvedValue({ data: [contact, secondContact] })
    confirmMock.mockReset()
  })

  it('initializes creation mode and loads contacts', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12,
      state: {
        titre: 'Premier contact',
        description: 'Description',
        date: '2026-11-07',
        status: Recherche_Stage_Status.Entretien,
        source: Demarche_Source.Telephone
      }
    })

    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalled())

    expect((wrapper.findComponent(UForm).props() as { state: Record<string, unknown> }).state).toMatchObject({
      titre: 'Premier contact',
      description: 'Description',
      date: '2026-11-07',
      status: Recherche_Stage_Status.Entretien,
      source: Demarche_Source.Telephone
    })
    expect(wrapper.findAllComponents(UButton).at(-1)?.text()).toBe('Créer l’événement')
    expect(wrapper.text()).toContain('Aucun contact sélectionné.')
    expect(wrapper.findAllComponents(UButton)[0]?.attributes('disabled')).toBeDefined()
  })

  it('initializes update mode with the event contacts', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: false,
      dossierId: 12,
      event
    })

    expect((wrapper.findComponent(UForm).props() as { state: Record<string, unknown> }).state).toMatchObject({
      titre: event.titre,
      description: event.description,
      date: event.date,
      status: event.status,
      source: event.source
    })
    expect(wrapper.text()).toContain('Jean Dupont')
    expect(wrapper.findAllComponents(UButton).at(-1)?.text()).toBe('Enregistrer les modifications')
    expect(wrapper.findAllComponents(UButton)[0]?.attributes('disabled')).toBeUndefined()
  })

  it('updates form fields through v-model bindings', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12
    })

    await wrapper.findComponent(UInput).find('input').setValue('Nouvel événement')
    await wrapper.findComponent(UTextarea).find('textarea').setValue('Relance téléphonique')

    expect((wrapper.findComponent(UForm).props() as { state: Record<string, unknown> }).state).toMatchObject({
      titre: 'Nouvel événement',
      description: 'Relance téléphonique'
    })
  })

  it('creates an event and emits the normalized event', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12,
      state: {
        titre: 'Candidature',
        description: 'CV envoyé',
        date: '2026-11-07',
        status: Recherche_Stage_Status.AttenteEnvoi,
        source: Demarche_Source.Email
      }
    })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })
    await vi.waitFor(() => expect(wrapper.findComponent(EventDescription).emitted('created')).toHaveLength(1))

    expect(wrapper.findComponent(EventDescription).emitted('created')?.[0]).toEqual([{
      idDemarche: 0,
      titre: 'Candidature',
      description: 'CV envoyé',
      date: '2026-11-07',
      status: Recherche_Stage_Status.AttenteEnvoi,
      source: Demarche_Source.Email,
      contacts: []
    }])
    expect(mocks.toast.add).toHaveBeenCalledWith({
      title: 'Succès',
      description: 'Événement créé avec succès',
      color: 'success'
    })
    expect(wrapper.findComponent(EventDescription).emitted('close')).toHaveLength(1)
  })

  it('updates an event only after confirmation', async () => {
    confirmMock.mockReturnValue(true)
    const wrapper = await mountWithUApp(EventDescription, {
      creation: false,
      dossierId: 12,
      event
    })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })

    expect(confirmMock).toHaveBeenCalledWith('Etes vous sûr de vouloir mettre à jour cet événement ?')
    await vi.waitFor(() => expect(wrapper.findComponent(EventDescription).emitted('updated')).toHaveLength(1))
    expect(wrapper.findComponent(EventDescription).emitted('updated')?.[0]?.[0]).toMatchObject(event)
    expect(wrapper.findComponent(EventDescription).emitted('close')).toHaveLength(1)
  })

  it('does not update when confirmation is canceled', async () => {
    confirmMock.mockReturnValue(false)
    const wrapper = await mountWithUApp(EventDescription, {
      creation: false,
      dossierId: 12,
      event
    })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: {} })

    expect(wrapper.findComponent(EventDescription).emitted('updated')).toBeUndefined()
    expect(wrapper.findComponent(EventDescription).emitted('close')).toBeUndefined()
  })

  it('adds and removes contacts without duplicates', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12
    })
    const contactMenu = wrapper.findComponent(UInputMenu)

    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalled())
    await contactMenu.vm.$emit('update:modelValue', { value: contact.idContact, label: 'Jean Dupont' })
    await contactMenu.vm.$emit('update:modelValue', { value: contact.idContact, label: 'Jean Dupont' })
    await contactMenu.vm.$emit('update:modelValue', { value: secondContact.idContact, label: 'Marie Martin' })
    await nextTick()

    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('Jean Dupont')
    expect(wrapper.text()).toContain('Marie Martin')

    await wrapper.findAll('button[aria-label="Supprimer le contact"]')[0]!.trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(1)
  })

  it('reports an unknown contact selection', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12
    })

    await wrapper.findComponent(UInputMenu).vm.$emit('update:modelValue', {
      value: 999,
      label: 'Unknown'
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      title: 'Erreur',
      description: 'Contact Unknown ne fait pas parti des contacts du dossier de recherche',
      color: 'error'
    })
  })

  it('creates a contact from the contact form and includes it in the event', async () => {
    const wrapper = await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12
    })
    const contactMenu = wrapper.findComponent(UInputMenu)

    await contactMenu.vm.$emit('create')
    expect(wrapper.findComponent(ContactForm).exists()).toBe(true)
    wrapper.findComponent(ContactForm).vm.$emit('created', secondContact)
    await nextTick()

    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Marie Martin')
  })

  it('deletes an update event only after confirmation', async () => {
    confirmMock.mockReturnValue(true)
    const wrapper = await mountWithUApp(EventDescription, {
      creation: false,
      dossierId: 12,
      event
    })
    const deleteButton = wrapper.findAllComponents(UButton)[0]!

    await deleteButton.trigger('click')

    expect(confirmMock).toHaveBeenCalledWith('Etes vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')
    expect(wrapper.findComponent(EventDescription).emitted('deleted')).toHaveLength(1)
  })

  it('reports contact loading failures', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    await mountWithUApp(EventDescription, {
      creation: true,
      dossierId: 12
    })

    await vi.waitFor(() => expect(mocks.toast.add).toHaveBeenCalledWith({
      title: 'Erreur',
      description: 'Erreur lors de la récupération des contacts',
      color: 'error'
    }))
    consoleError.mockRestore()
  })
})