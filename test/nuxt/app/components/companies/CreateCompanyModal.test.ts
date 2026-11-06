import { UButton, UFormField, USeparator } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateCompanyModal, { type EntrepriseStateReactive } from '~/components/companies/CreateCompanyModal.vue'
import SearchCompanySiretForm from '~/components/companies/forms/SearchCompanySiretForm.vue'
import { mountWithUApp, resetNuxtMocks } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), toast: { add: vi.fn() } }))
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const entrepriseExampleData = {
  nom: 'Test Company',
  adresse: '55 Rue du Faubourg Saint-Honoré',
  codePostal: '75008',
  ville: 'Paris',
  pays: 'France',
  siret: ''
}

describe('CreateCompanyModal', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
  })

  it('check if not open by default', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: false })

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(false)
  })

  it('check content', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })
    const modal = wrapper.findComponent({ name: 'UModal' })

    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(true)

    const searchCompanySiretForm = modal.findComponent(SearchCompanySiretForm)
    expect(searchCompanySiretForm.exists()).toBe(true)

    const seperator = modal.findComponent(USeparator)
    expect(seperator.exists()).toBe(true)
    expect(seperator.props('label')).toBe('ou')

    const companyInputFields = wrapper.findAllComponents(UFormField).filter(component => component.props('label') !== 'Préremplir avec le SIRET')
    const nomLabels = ['Nom de l\'entreprise', 'Nom de l\'établissement (optionnel)', 'Adresse', 'Code postal', 'Ville', 'Entreprise étrangère']

    expect(companyInputFields.length).toBe(nomLabels.length)
    for (let i = 0; i < companyInputFields.length; i++) {
      expect(companyInputFields[i]!.props('label')).toBe(nomLabels[i])
    }

    const createButton = wrapper.findAllComponents(UButton).find(button => button.text() === 'Créer')
    expect(createButton).toBeDefined()
  })

  it('check initialNomEntreprise prop', async () => {
    const initialNomEntreprise = 'Test'
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise })

    const nomEntrepriseField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'entreprise')
    expect(nomEntrepriseField).toBeDefined()

    const nomEntrepriseInput = nomEntrepriseField?.find('input')
    expect(nomEntrepriseInput).toBeDefined()
    expect(nomEntrepriseInput?.element.value).toBe(initialNomEntreprise)
  })

  it('uses an empty name when initialNomEntreprise is omitted', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true })

    const nomEntrepriseField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'entreprise')
    expect(nomEntrepriseField?.find('input').element.value).toBe('')
  })

  it('check close and open modal - reset value', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: 'Test' })

    const nomEntrepriseField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'entreprise')
    expect(nomEntrepriseField).toBeDefined()

    const nomEntrepriseInput = nomEntrepriseField?.find('input')
    expect(nomEntrepriseInput).toBeDefined()
    expect(nomEntrepriseInput?.element.value).toBe('Test')

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)

    await nomEntrepriseInput!.setValue('New Test')
    expect(nomEntrepriseInput!.element.value).toBe('New Test')

    await modal.vm.$emit('update:open', false)
    expect(modal.props('open')).toBe(false)

    await modal.vm.$emit('update:open', true)
    expect(modal.props('open')).toBe(true)

    const nomEntrepriseInputAfterReopen = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'entreprise')?.find('input')
    expect(nomEntrepriseInputAfterReopen).toBeDefined()
    expect(nomEntrepriseInputAfterReopen!.element.value).toBe('Test')
  })

  it('on entreprise found', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)

    const oldSearchCompanySiretForm = modal.findComponent(SearchCompanySiretForm)
    expect(oldSearchCompanySiretForm.exists()).toBe(true)

    const oldNomEntrepriseInput = oldSearchCompanySiretForm?.find('input')
    expect(oldNomEntrepriseInput).toBeDefined()
    expect(oldNomEntrepriseInput!.element.value).toBe('')

    oldSearchCompanySiretForm.vm.$emit('found', entrepriseExampleData)
    await nextTick()

    const nomEntrepriseField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'entreprise')
    expect(nomEntrepriseField).toBeDefined()

    const nomEntrepriseInput = nomEntrepriseField?.find('input')
    expect(nomEntrepriseInput).toBeDefined()
    expect(nomEntrepriseInput!.element.value).toBe(entrepriseExampleData.nom)
  })

  it('check etranger switch', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)

    const beforeCountryField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Pays')
    expect(beforeCountryField).not.toBeDefined()

    const etrangerSwitch = wrapper.findAllComponents({ name: 'USwitch' }).find(component => component.props('label') === 'L\'entreprise est-elle à l\'étranger ?')
    expect(etrangerSwitch).toBeDefined()

    const etrangerSwitchInput = etrangerSwitch?.find('button')
    expect(etrangerSwitchInput).toBeDefined()

    expect(etrangerSwitchInput!.attributes('aria-checked')).toBe('false')

    await etrangerSwitchInput!.trigger('click')
    expect(etrangerSwitchInput!.attributes('aria-checked')).toBe('true')

    const afterCountryField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Pays')
    expect(afterCountryField).toBeDefined()
  })

  it('submit valid form', async () => {
    mocks.fetch.mockResolvedValueOnce({ ...entrepriseExampleData, idEntreprise: 1 })

    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })

    const modal = wrapper.findComponent({ name: 'UModal' })
    const searchForm = modal.findComponent(SearchCompanySiretForm)
    searchForm.vm.$emit('found', entrepriseExampleData)
    await nextTick()

    const form = wrapper.findAllComponents({ name: 'UForm' }).find(component => component.attributes('id') === 'create-company-form')
    expect(form).toBeDefined()
    form!.vm.$emit('submit', { data: entrepriseExampleData })

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies', {
        method: 'POST',
        body: {
          ...entrepriseExampleData,
          nomEtab: null,
          siret: null
        }
      })
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Entreprise créée',
      description: 'L\'entreprise a été créée avec succès.'
    })
  })

  it('submit form - network error', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })

    const modal = wrapper.findComponent({ name: 'UModal' })
    const searchForm = modal.findComponent(SearchCompanySiretForm)
    searchForm.vm.$emit('found', entrepriseExampleData)
    await nextTick()

    const form = wrapper.findAllComponents({ name: 'UForm' }).find(component => component.attributes('id') === 'create-company-form')
    expect(form).toBeDefined()
    form!.vm.$emit('submit', { data: entrepriseExampleData })

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies', {
        method: 'POST',
        body: {
          ...entrepriseExampleData,
          nomEtab: null,
          siret: null
        }
      })
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la création de l\'entreprise.'
    })
  })

  it('submits null when code postal is empty', async () => {
    const entrepriseWithoutCodePostal = { ...entrepriseExampleData, codePostal: '', pays: 'Suisse' }
    mocks.fetch.mockResolvedValueOnce({ ...entrepriseWithoutCodePostal, idEntreprise: 1 })

    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })
    const form = wrapper.findAllComponents({ name: 'UForm' }).find(component => component.attributes('id') === 'create-company-form')
    expect(form).toBeDefined()

    form!.vm.$emit('submit', { data: entrepriseWithoutCodePostal })

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies', {
        method: 'POST',
        body: {
          ...entrepriseWithoutCodePostal,
          nomEtab: null,
          codePostal: null,
          siret: null
        }
      })
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Entreprise créée',
      description: 'L\'entreprise a été créée avec succès.'
    })
  })

  it('rejects invalid form data before fetching', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })
    const form = wrapper.findAllComponents({ name: 'UForm' }).find(component => component.attributes('id') === 'create-company-form')
    expect(form).toBeDefined()

    form!.vm.$emit('submit', { data: { ...entrepriseExampleData, codePostal: '' } })

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        color: 'error',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de l\'entreprise.'
      })
    })
  })

  it('updates the state when fields change', async () => {
    const wrapper = await mountWithUApp(CreateCompanyModal, { open: true, initialNomEntreprise: '' })

    const nomEntrepriseField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'entreprise')
    expect(nomEntrepriseField).toBeDefined()

    const nomEtabField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Nom de l\'établissement (optionnel)')
    expect(nomEtabField).toBeDefined()

    const adresseField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Adresse')
    expect(adresseField).toBeDefined()

    const codePostalField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Code postal')
    expect(codePostalField).toBeDefined()

    const villeField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Ville')
    expect(villeField).toBeDefined()

    const etrangerSwitch = wrapper.findAllComponents({ name: 'USwitch' }).find(component => component.props('label') === 'L\'entreprise est-elle à l\'étranger ?')
    expect(etrangerSwitch).toBeDefined()

    await nomEntrepriseField!.find('input').setValue('NomTest')
    await nomEtabField!.find('input').setValue('EtabTest')
    await adresseField!.find('input').setValue('AdresseTest')
    await codePostalField!.find('input').setValue('11111')
    await villeField!.find('input').setValue('Berne')
    await etrangerSwitch!.find('button').trigger('click')

    const countryField = wrapper.findAllComponents(UFormField).find(component => component.props('label') === 'Pays')
    expect(countryField).toBeDefined()
    await countryField!.find('input').setValue('Suisse')

    const state = (wrapper.findComponent(CreateCompanyModal).vm as unknown as { state: EntrepriseStateReactive }).state

    expect(state).toMatchObject({
      nom: 'NomTest',
      nomEtab: 'EtabTest',
      adresse: 'AdresseTest',
      codePostal: '11111',
      ville: 'Berne',
      pays: 'Suisse',
      etranger: true
    })

    await etrangerSwitch!.find('button').trigger('click')
    expect(state.pays).toBe('France')
  })
})
