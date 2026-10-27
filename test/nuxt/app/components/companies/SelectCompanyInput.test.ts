import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateCompanyModal from '~/components/companies/CreateCompanyModal.vue'
import SelectCompanyInput from '~/components/companies/SelectCompanyInput.vue'
import { mountWithUApp, resetNuxtMocks, type Wrapper } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toast: { add: vi.fn() }
}))
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const apiCompanies = [
  { idEntreprise: 1, nom: 'Entreprise A', ville: 'Paris', codePostal: '75001' },
  { idEntreprise: 2, nom: 'Entreprise B', ville: 'Lyon', codePostal: null }
]

const entreprise1Item = { label: 'Entreprise A', city: 'Paris', codePostal: '75001', value: 1 }
const entreprise2Item = { label: 'Entreprise B', city: 'Lyon', codePostal: null, value: 2 }

describe('SelectCompanyInput', () => {
  let wrapper: Wrapper
  beforeEach(() => {
    wrapper?.unmount()
    resetNuxtMocks(mocks)
  })

  it('check content', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const select = wrapper.findComponent(SelectCompanyInput)
    expect(select.exists()).toBe(true)

    const input = wrapper.findComponent({ name: 'UInputMenu' })
    expect(input.exists()).toBe(true)

    const modal = wrapper.findComponent(CreateCompanyModal)
    expect(modal.exists()).toBe(true)

    expect(input.html()).toContain('Sélectionner une entreprise')
  })

  it('has the right initial state', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })
    const modal = wrapper.findComponent(CreateCompanyModal)

    expect(input.props('items')).toEqual([])
    expect(input.props('loading')).toBe(false)
    expect(input.props('createItem')).toBe('always')
    expect(input.props('ignoreFilter')).toBe(true)
    expect(modal.props('open')).toBe(false)
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('fetches companies after the debounce when typing a search term', async () => {
    mocks.fetch.mockResolvedValueOnce(apiCompanies)

    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'acme')
    await nextTick()

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies', expect.objectContaining({
        query: expect.objectContaining({ search: 'acme' })
      }))
    })
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('maps API results to items', async () => {
    mocks.fetch.mockResolvedValueOnce(apiCompanies)

    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'a')
    await nextTick()

    await vi.waitFor(() => {
      expect(input.props('items')).toEqual([entreprise1Item, entreprise2Item])
    })
  })

  it('does not fetch when the search term is blank', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', '   ')
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 400))

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(input.props('items')).toEqual([])
  })

  it('shows the create option when no company matches', async () => {
    mocks.fetch.mockResolvedValueOnce([])

    wrapper = await mountWithUApp(SelectCompanyInput)

    const menu = wrapper.findComponent({ name: 'UInputMenu' })
    await menu.get('button[aria-label="Show options"]').trigger('click')
    await nextTick()

    menu.vm.$emit('update:searchTerm', 'a')
    await nextTick()

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies', expect.objectContaining({
        query: expect.objectContaining({ search: 'a' })
      }))
      expect(menu.props('items')).toHaveLength(0)
    })

    expect(document.body.textContent).toContain('Créer l\'entreprise "a"')
  })

  it('clears the results when the search term is emptied', async () => {
    mocks.fetch.mockResolvedValueOnce(apiCompanies)

    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })
    await input.get('button[aria-label="Show options"]').trigger('click')
    await nextTick()

    input.vm.$emit('update:searchTerm', 'a')
    await nextTick()
    await vi.waitFor(() => {
      expect(input.props('items')).toHaveLength(2)
    })

    input.vm.$emit('update:searchTerm', '')
    await nextTick()

    await vi.waitFor(() => {
      expect(input.props('items')).toEqual([])
    })
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('debounces successive searches into a single call', async () => {
    mocks.fetch.mockResolvedValueOnce(apiCompanies)

    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'a')
    await nextTick()

    input.vm.$emit('update:searchTerm', 'ac')
    await nextTick()

    input.vm.$emit('update:searchTerm', 'acm')
    await nextTick()

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies', expect.objectContaining({
        query: expect.objectContaining({ search: 'acm' })
      }))
    })

    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('updates idEntreprise when a company is selected', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const select = wrapper.findComponent(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:modelValue', entreprise1Item)
    await nextTick()

    expect(select.emitted('update:idEntreprise')).toBeTruthy()
    expect(select.emitted('update:idEntreprise')?.[0]).toEqual([1])
  })

  it('resets idEntreprise when the selection is cleared', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const select = wrapper.findComponent(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:modelValue', entreprise1Item)
    await nextTick()
    input.vm.$emit('update:modelValue', undefined)
    await nextTick()

    expect(select.emitted('update:idEntreprise')?.at(-1)).toEqual([undefined])
  })

  it('only exposes the selected company when the search term is empty', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const select = wrapper.findComponent(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:modelValue', entreprise2Item)
    await nextTick()

    expect(input.props('modelValue')).toEqual(entreprise2Item)

    input.vm.$emit('update:searchTerm', '')
    await nextTick()

    const vm = select.vm as unknown as { companyItems: object[] }
    expect(vm.companyItems).toEqual([entreprise2Item])
  })

  it('opens the creation modal with the typed name', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'Test Entreprise')
    await nextTick()

    input.vm.$emit('create', 'Test Entreprise')
    await nextTick()

    const modal = wrapper.findComponent(CreateCompanyModal)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('initialNomEntreprise')).toBe('Test Entreprise')
  })

  it('resets the search term and closes the menu when creating', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'Test Entreprise')
    await nextTick()

    input.vm.$emit('create', 'Test Entreprise')
    await nextTick()

    const newInput = wrapper.findComponent({ name: 'UInputMenu' })
    expect(newInput.props('searchTerm')).toBe('')
    expect(newInput.props('open')).toBe(false)
  })

  it('closes the modal when it asks for it', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'Test Entreprise')
    await nextTick()

    input.vm.$emit('create', 'Test Entreprise')
    await nextTick()

    wrapper.findComponent(CreateCompanyModal).vm.$emit('update:open', false)
    await nextTick()

    expect(wrapper.findComponent(CreateCompanyModal).props('open')).toBe(false)
  })

  it('selects the company once created', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const select = wrapper.findComponent(SelectCompanyInput)

    wrapper.findComponent(CreateCompanyModal).vm.$emit('created', {
      idEntreprise: 42,
      nom: 'Entreprise C',
      ville: 'Nantes',
      codePostal: '44000'
    })
    await nextTick()

    const expected = { label: 'Entreprise C', city: 'Nantes', codePostal: '44000', value: 42 }

    const input = wrapper.findComponent({ name: 'UInputMenu' })
    expect(select.emitted('update:idEntreprise')?.at(-1)).toEqual([42])
    expect(input.props('modelValue')).toEqual(expected)
    expect(input.props('items')).toEqual([expected])
  })

  it('puts the created company first in the list without duplicating it', async () => {
    mocks.fetch.mockResolvedValueOnce(apiCompanies)

    wrapper = await mountWithUApp(SelectCompanyInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'a')
    await nextTick()
    await vi.waitFor(() => {
      expect(input.props('items')).toEqual([entreprise1Item, entreprise2Item])
    })

    wrapper.findComponent(CreateCompanyModal).vm.$emit('created', {
      idEntreprise: 2,
      nom: 'Entreprise B',
      ville: 'Lyon',
      codePostal: null
    })
    await nextTick()

    const newInput = wrapper.findComponent({ name: 'UInputMenu' })
    const items = newInput.props('items') as Array<{ value: number }>
    expect(items.map(item => item.value)).toEqual([2, 1])
  })

  it('displays the city with its postal code', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const vm = wrapper.findComponent(SelectCompanyInput).vm as unknown as { displayCity: (item: object) => string }

    expect(vm.displayCity(entreprise1Item)).toBe('Paris (75001)')
  })

  it('displays only the city when there is no postal code', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const vm = wrapper.findComponent(SelectCompanyInput).vm as unknown as { displayCity: (item: object) => string }

    expect(vm.displayCity(entreprise2Item)).toBe('Lyon')
  })

  it('displays nothing when there is no city', async () => {
    wrapper = await mountWithUApp(SelectCompanyInput)
    const vm = wrapper.findComponent(SelectCompanyInput).vm as unknown as { displayCity: (item: object) => string }

    expect(vm.displayCity({ label: 'Entreprise B', city: null, codePostal: '69000', value: 2 })).toBe('')
    expect(vm.displayCity({ label: 'Entreprise B', value: 2 })).toBe('')
  })
})
