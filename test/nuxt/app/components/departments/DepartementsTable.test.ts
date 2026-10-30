import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import ConfirmModal from '~/components/common/ConfirmModal.vue'
import DepartmentsTable from '~/components/departments/DepartmentsTable.vue'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  fetch: vi.fn(),
  refresh: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('useFetch', () => mocks.useFetch)
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const departmeents = [
  { idDepartement: 1, nom: 'Informatique' },
  { idDepartement: 2, nom: 'Chimie' }
]

async function mountTable() {
  mocks.useFetch.mockReturnValue({
    data: ref(departmeents),
    refresh: mocks.refresh
  })

  return mountSuspended(DepartmentsTable)
}

describe('DepartementsTable', () => {
  it('renders rows and cell values', async () => {
    const wrapper = await mountTable()

    const rows = wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')

    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('Informatique')
    expect(rows[1]!.text()).toContain('Chimie')

    const firstTableRow = wrapper.findComponent({ name: 'UTable' }).vm.tableApi.getRowModel().rows[0]
    expect(firstTableRow.getValue('nom')).toBe('Informatique')
  })

  it('filters elements', async () => {
    const wrapper = await mountTable()
    const input = wrapper.findComponent({ name: 'UInput' }).find('input')

    await input.setValue('info')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Informatique')

    await input.setValue('gmp')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findComponent({ name: 'UTable' }).text()).not.toContain('Chimie')
    expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Aucune donnée disponible.')

    await input.setValue('')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(2)
  })

  it('emits edit action', async () => {
    const wrapper = await mountTable()

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Modifier'
    })

    expect(dropdown).toBeDefined()

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![0]!.onSelect()

    expect(wrapper.emitted('edit')?.[0]).toEqual([departmeents[0]])
  })

  it('opens delete modal with selected department', async () => {
    const wrapper = await mountTable()

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Supprimer'
    })

    expect(dropdown).toBeDefined()

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![1]!.onSelect()

    await nextTick()

    const modal = wrapper.findComponent(ConfirmModal)

    expect(modal.exists()).toBe(true)
    expect(modal.props('title')).toBe('Supprimer le département')
    expect(modal.props('description')).toContain('Êtes-vous sûr de vouloir supprimer le département Informatique ?')
  })

  it('deletes department on modal confirm', async () => {
    mocks.fetch.mockResolvedValueOnce(undefined)
    mocks.refresh.mockResolvedValueOnce(undefined)

    const wrapper = await mountTable()

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Supprimer'
    })

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![1]!.onSelect()

    const modal = wrapper.findComponent(ConfirmModal)

    modal.vm.$emit('confirm')

    expect($fetch).toHaveBeenCalledWith(
      '/api/departments/1',
      { method: 'DELETE' }
    )

    await vi.waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledTimes(1)
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Département supprimé',
        description: 'Le département Informatique a été supprimé avec succès.',
        color: 'success'
      })
    })
  })

  it('closes delete modal on cancel', async () => {
    const wrapper = await mountTable()

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Supprimer'
    })

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![1]!.onSelect()
    await nextTick()

    const modal = wrapper.findComponent(ConfirmModal)

    modal.vm.$emit('cancel')
    await nextTick()

    expect(modal.findComponent({ name: 'UModal' }).props('open')).toBe(false)
  })

  it('does not delete a department when none is selected', async () => {
    const wrapper = await mountTable()

    const modal = wrapper.findComponent(ConfirmModal)
    modal.vm.$emit('confirm')

    await nextTick()

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(mocks.toast.add).not.toHaveBeenCalled()
  })
})
