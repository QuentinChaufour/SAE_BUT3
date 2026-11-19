import { UForm, UFormField, UModal } from '#components'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EditCompanyModal from '~/components/companies/EditCompanyModal.vue'
import { mountWithUApp, resetNuxtMocks } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), toast: { add: vi.fn() } }))
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const company = {
  idEntreprise: 1,
  nom: 'Entreprise A',
  nomEtab: 'Campus A',
  adresse: '10 rue Victor Hugo',
  codePostal: '75001',
  ville: 'Paris',
  siret: '12345678901234',
  pays: 'France'
}

describe('EditCompanyModal', () => {
  beforeEach(() => resetNuxtMocks(mocks))

  it('pre-fills fields and displays read-only mode', async () => {
    const wrapper = await mountWithUApp(EditCompanyModal, {
      open: true,
      editCompany: company,
      readOnly: true
    })

    const modal = wrapper.findComponent(UModal)
    expect(modal.props('title')).toBe('Informations sur l\'entreprise Entreprise A')
    expect(wrapper.findAllComponents(UFormField)).toHaveLength(6)
    expect(wrapper.findComponent({ name: 'UInput' }).find('input').element.value).toBe('Entreprise A')
    expect(wrapper.findComponent({ name: 'USwitch' }).props('disabled')).toBe(true)
  })

  it('sends the modified company and emits saved', async () => {
    mocks.fetch.mockResolvedValueOnce({ ...company, nom: 'Entreprise B' })
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: company })

    await wrapper.findAllComponents({ name: 'UInput' }).find(field => field.props('class') === 'w-full')!.find('input').setValue('Entreprise B')
    wrapper.findComponent(UForm).vm.$emit('submit', {
      data: { ...company, nom: 'Entreprise B', nomEtab: 'Campus A', siret: '12345678901234' }
    })

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies/1', {
        method: 'PATCH',
        body: {
          nom: 'Entreprise B',
          nomEtab: 'Campus A',
          adresse: '10 rue Victor Hugo',
          ville: 'Paris',
          codePostal: '75001',
          siret: '12345678901234',
          pays: 'France'
        }
      })
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      title: 'Entreprise mise à jour',
      description: 'L\'entreprise Entreprise B a été mise à jour avec succès.',
      color: 'success'
    })
    expect(wrapper.findComponent(EditCompanyModal).emitted('saved')?.[0]).toEqual([{ ...company, nom: 'Entreprise B' }])
  })

  it('shows an error toast without emitting saved on failure', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: company })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: company })

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'entreprise.',
        color: 'error'
      })
    })
    expect(wrapper.findComponent(EditCompanyModal).emitted('saved')).toBeUndefined()
  })

  it('switches from France to a foreign country', async () => {
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: company })
    const switchComponent = wrapper.findComponent({ name: 'USwitch' })

    await switchComponent.find('button').trigger('click')

    const vm = wrapper.findComponent(EditCompanyModal).vm as unknown as { state: { pays: string, etranger: boolean } }
    expect(vm.state).toMatchObject({ pays: '', etranger: true })
  })

  it('uses default values when no company is provided', async () => {
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true })
    const vm = wrapper.findComponent(EditCompanyModal).vm as unknown as {
      state: { nom: string, nomEtab: string, adresse: string, ville: string, codePostal: string, siret: string, pays: string, etranger: boolean }
    }

    expect(vm.state).toMatchObject({
      nom: '',
      nomEtab: '',
      adresse: '',
      ville: '',
      codePostal: '',
      siret: '',
      pays: 'France',
      etranger: true
    })
  })

  it('does not submit in read-only mode or without a company', async () => {
    const readOnlyWrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: company, readOnly: true })
    readOnlyWrapper.findComponent(UForm).vm.$emit('submit', { data: company })

    const emptyWrapper = await mountWithUApp(EditCompanyModal, { open: true })
    emptyWrapper.findComponent(UForm).vm.$emit('submit', { data: company })

    await nextTick()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('rejects invalid submitted data', async () => {
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: company })

    wrapper.findComponent(UForm).vm.$emit('submit', { data: { ...company, nom: '' } })

    await vi.waitFor(() => {
      expect(mocks.fetch).not.toHaveBeenCalled()
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'entreprise.',
        color: 'error'
      })
    })
  })

  it('resets the state when reopening and switches back to France', async () => {
    const wrapper = await mountWithUApp(EditCompanyModal, { open: false, editCompany: company })
    const vm = wrapper.findComponent(EditCompanyModal).vm as unknown as {
      state: { pays: string, etranger: boolean }
    }

    wrapper.findComponent(UModal).vm.$emit('update:open', true)
    await nextTick()
    expect(vm.state.pays).toBe('France')

    const switchComponent = wrapper.findComponent({ name: 'USwitch' })
    await switchComponent.find('button').trigger('click')
    expect(vm.state).toMatchObject({ pays: '', etranger: true })

    await switchComponent.find('button').trigger('click')
    expect(vm.state).toMatchObject({ pays: 'France', etranger: false })
  })

  it('updates every editable field', async () => {
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: company })
    const fields = wrapper.findAllComponents(UFormField)

    await fields.find(field => field.props('label') === 'Nom de l\'entreprise')!.find('input').setValue('Nouvelle entreprise')
    await fields.find(field => field.props('label') === 'Nom de l\'établissement (optionnel)')!.find('input').setValue('Nouvel établissement')
    await fields.find(field => field.props('label') === 'Adresse')!.find('input').setValue('20 rue de Lyon')
    await fields.find(field => field.props('label') === 'Code postal')!.find('input').setValue('69001')
    await fields.find(field => field.props('label') === 'Ville')!.find('input').setValue('Lyon')

    const vm = wrapper.findComponent(EditCompanyModal).vm as unknown as {
      state: { nom: string, nomEtab: string, adresse: string, codePostal: string, ville: string }
    }
    expect(vm.state).toMatchObject({
      nom: 'Nouvelle entreprise',
      nomEtab: 'Nouvel établissement',
      adresse: '20 rue de Lyon',
      codePostal: '69001',
      ville: 'Lyon'
    })
  })

  it('update country information', async () => {
    const foreignCompany = { ...company, pays: 'Suisse', codePostal: null }
    const wrapper = await mountWithUApp(EditCompanyModal, { open: true, editCompany: foreignCompany })
    const vm = wrapper.findComponent(EditCompanyModal).vm as unknown as {
      state: { pays: string, codePostal: string, etranger: boolean }
    }

    expect(vm.state).toMatchObject({ pays: 'Suisse', codePostal: '', etranger: true })
    await wrapper.findAllComponents(UFormField).find(field => field.props('label') === 'Pays')!.find('input').setValue('Belgique')
    expect(vm.state.pays).toBe('Belgique')
  })
})
