import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfirmModal from '~/components/common/ConfirmModal.vue'
import DataTable from '~/components/common/DataTable.vue'
import CompaniesSearchTable from '~/components/companies/CompaniesSearchTable.vue'
import { mountWithUApp, resetNuxtMocks } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  fetch: vi.fn(),
  refresh: vi.fn(),
  navigateTo: vi.fn(),
  toast: { add: vi.fn() }
}))
mockNuxtImport('useFetch', () => mocks.useFetch)
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('navigateTo', () => mocks.navigateTo)
mockNuxtImport('useToast', () => () => mocks.toast)

const companies = [
  { idEntreprise: 1, nom: 'Entreprise A', nomEtab: 'Campus A', ville: 'Paris', codePostal: '75001', pays: 'France', nbCandidatures: 3, nbAcceptedCandidatures: 1 },
  { idEntreprise: 2, nom: 'Entreprise B', nomEtab: null, ville: 'Genève', codePostal: null, pays: 'Suisse', nbCandidatures: 0, nbAcceptedCandidatures: 0 }
]

describe('CompaniesSearchTable', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
    mocks.useFetch.mockReturnValue({ data: ref(companies), refresh: mocks.refresh })
  })

  it('renders companies and filters results', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const table = wrapper.findComponent({ name: 'UTable' })

    expect(table.findAll('tbody tr')).toHaveLength(2)
    expect(table.text()).toContain('Entreprise A')
    expect(table.text()).toContain('75001 Paris')

    await wrapper.findComponent({ name: 'UInput' }).find('input').setValue('Campus')
    expect(table.findAll('tbody tr')).toHaveLength(1)
    expect(table.text()).toContain('Campus A')
  })

  it('exposes edit and delete actions according to role', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Modifier'
    })

    expect(dropdown).toBeDefined()
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]

    actions[0]![1]!.onSelect()
    expect(wrapper.findComponent(CompaniesSearchTable).emitted('edit')?.[0]).toEqual([companies[0]])
  })

  it('deletes a company and refreshes the table', async () => {
    mocks.fetch.mockResolvedValueOnce(undefined)
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[2]?.label === 'Supprimer'
    })

    expect(dropdown).toBeDefined()
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![2]!.onSelect()
    await nextTick()
    wrapper.findComponent(ConfirmModal).vm.$emit('confirm')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/companies/1', { method: 'DELETE' })
      expect(mocks.refresh).toHaveBeenCalledTimes(1)
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Entreprise supprimée',
        description: 'L\'entreprise Entreprise A a été supprimée avec succès.',
        color: 'success'
      })
    })
  })

  it('uses read-only actions for teachers', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable, { readOnly: true })
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Voir les infos'
    })

    expect(dropdown).toBeDefined()
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    expect(actions[0]!.map(item => item.label)).toEqual(['Voir les infos', 'Recherches étudiantes'])
  })

  it('emits edit for the read-only view action', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable, { readOnly: true })
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Voir les infos'
    })
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]

    actions[0]![0]!.onSelect()

    expect(wrapper.findComponent(CompaniesSearchTable).emitted('edit')?.[0]).toEqual([companies[0]])
  })

  it('navigates to the company student-search page', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Recherches étudiantes'
    })
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]

    actions[0]![0]!.onSelect()

    expect(mocks.navigateTo).toHaveBeenCalledWith('/companies/1/student-search')
  })

  it('navigates to the student-search page when a company row is selected', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    wrapper.findComponent(DataTable).vm.$emit('selected', companies[1]!)
    expect(mocks.navigateTo).toHaveBeenCalledWith('/companies/2/student-search')
  })

  it('does not delete when no company is selected', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)

    wrapper.findComponent(ConfirmModal).vm.$emit('confirm')
    await nextTick()

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it('shows an error toast when deletion fails', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[2]?.label === 'Supprimer'
    })
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]

    actions[0]![2]!.onSelect()
    await nextTick()
    wrapper.findComponent(ConfirmModal).vm.$emit('confirm')

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de l\'entreprise Entreprise A.',
        color: 'error'
      })
    })
  })

  it('closes the delete confirmation on cancel', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[2]?.label === 'Supprimer'
    })
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]

    actions[0]![2]!.onSelect()
    await nextTick()
    wrapper.findComponent(ConfirmModal).vm.$emit('cancel')
    await nextTick()

    expect(wrapper.findComponent(ConfirmModal).props('open')).toBe(false)
  })

  it('exposes search fields and refresh', async () => {
    const wrapper = await mountWithUApp(CompaniesSearchTable)
    const vm = wrapper.findComponent(CompaniesSearchTable).vm as unknown as {
      searchFields: (company: typeof companies[number]) => (string | null)[]
      columns: Array<{ id?: string, accessorFn?: (row: typeof companies[number]) => unknown, cell?: (context: unknown) => unknown }>
      refresh: () => void
    }

    expect(vm.searchFields(companies[0]!)).toEqual(['Entreprise A', 'Campus A'])
    expect(vm.searchFields(companies[1]!)).toEqual(['Entreprise B', null])

    const nomColumn = vm.columns.find(column => column.id === 'nom')
    expect(nomColumn?.accessorFn?.(companies[0]!)).toBe('Entreprise A - Campus A')
    expect(nomColumn?.accessorFn?.(companies[1]!)).toBe('Entreprise B')

    const villeColumn = vm.columns.find(column => column.id === 'ville')
    expect(villeColumn?.accessorFn?.(companies[0]!)).toBe('75001 Paris')
    expect(villeColumn?.accessorFn?.(companies[1]!)).toBe('Genève, Suisse')
    expect(villeColumn?.cell?.({
      row: { original: { ville: null, codePostal: null, pays: 'France' } }
    })).toBe('N/A')

    vm.refresh()
    expect(mocks.refresh).toHaveBeenCalledTimes(1)
  })
})
