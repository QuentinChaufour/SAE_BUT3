import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import ConfirmModal from '~/components/common/ConfirmModal.vue'
import PersonnelEditModal from '~/components/personnels/PersonnelEditModal.vue'
import PersonnelsTable from '~/components/personnels/PersonnelsTable.vue'
import { mountWithUApp } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  fetch: vi.fn(),
  refresh: vi.fn(),
  toast: { add: vi.fn() }
}))

mockNuxtImport('useFetch', () => mocks.useFetch)
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const personnelsAdmin = [
  { numPersonnel: 'p1234', nom: 'Doe', prenom: 'John', role: 'admin' },
  { numPersonnel: 'p5678', nom: 'Smith', prenom: 'Jane', role: 'admin' }
]

const personnelsSecretariat = [
  { numPersonnel: 'p9012', nom: 'Johnson', prenom: 'Dwayne', role: 'secretariat' },
  { numPersonnel: 'p3456', nom: 'Loarn', prenom: 'Alice', role: 'secretariat' }
]

const department = { idDepartement: 1, nom: 'Informatique' }

async function mountTable(type: 'admin' | 'secretariat' = 'admin') {
  const personnels = type === 'admin' ? personnelsAdmin : personnelsSecretariat
  mocks.useFetch.mockReturnValue({
    data: ref(personnels),
    refresh: mocks.refresh
  })

  const props: Record<string, unknown> = { type }
  if (type === 'secretariat') props.department = department

  return mountWithUApp(PersonnelsTable, props)
}

describe('PersonnelsTable', () => {
  it('renders rows and cell values', async () => {
    const wrapper = await mountTable()

    const rows = wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')

    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('Doe')
    expect(rows[0]!.text()).toContain('John')
    expect(rows[1]!.text()).toContain('Smith')
    expect(rows[1]!.text()).toContain('Jane')

    const firstTableRow = wrapper.findComponent({ name: 'UTable' }).vm.tableApi.getRowModel().rows[0]
    expect(firstTableRow.getValue('nom')).toBe('Doe')
  })

  it('filters elements', async () => {
    const wrapper = await mountTable()
    const input = wrapper.findComponent({ name: 'UInput' }).find('input')

    await input.setValue('doe')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Doe')

    await input.setValue('pierre')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findComponent({ name: 'UTable' }).text()).not.toContain('Doe')
    expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Aucune donnée disponible.')

    await input.setValue('')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(2)
  })

  it('emits edit action and opens edit modal', async () => {
    const wrapper = await mountTable()

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Modifier'
    })

    expect(dropdown).toBeDefined()

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![0]!.onSelect()

    expect(wrapper.findComponent(PersonnelsTable).emitted('edit-personnel')?.[0]).toEqual([personnelsAdmin[0]])

    await nextTick()

    const modal = wrapper.findComponent(PersonnelEditModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('editPersonnel')).toEqual(personnelsAdmin[0])
  })

  it('refresh departments on modal saved', async () => {
    const wrapper = await mountTable()

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Modifier'
    })

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![0]!.onSelect()
    await nextTick()

    const modal = wrapper.findComponent(PersonnelEditModal)
    modal.vm.$emit('saved')

    expect(mocks.refresh).toHaveBeenCalledTimes(1)
  })

  it('opens delete modal with selected personnel', async () => {
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
    expect(modal.props('title')).toBe('Supprimer le personnel')
    expect(modal.props('description')).toContain('Êtes-vous sûr de vouloir supprimer le personnel John Doe ?')
  })

  it('deletes personnel on modal confirm', async () => {
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
      '/api/personnels/p1234',
      { method: 'DELETE' }
    )

    await vi.waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledTimes(1)
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Personnel supprimée',
        description: 'Le personnel John Doe a été supprimé avec succès.',
        color: 'success'
      })
    })
  })

  it('network error on deletes department on modal confirm', async () => {
    const wrapper = await mountTable()
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Supprimer'
    })

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![1]!.onSelect()

    const modal = wrapper.findComponent(ConfirmModal)

    modal.vm.$emit('confirm')

    expect($fetch).toHaveBeenCalledWith(
      '/api/personnels/p1234',
      { method: 'DELETE' }
    )

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression du personnel John Doe.',
        color: 'error'
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

  it('does not delete personnel when none is selected', async () => {
    const wrapper = await mountTable()

    const modal = wrapper.findComponent(ConfirmModal)
    modal.vm.$emit('confirm')

    await nextTick()

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(mocks.toast.add).not.toHaveBeenCalled()
  })

  describe('PersonnelsTable with secretariat type', () => {
    it('renders rows and cell values', async () => {
      const wrapper = await mountTable('secretariat')

      const rows = wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')

      expect(rows).toHaveLength(2)
      expect(rows[0]!.text()).toContain('Johnson')
      expect(rows[0]!.text()).toContain('Dwayne')
      expect(rows[1]!.text()).toContain('Loarn')
      expect(rows[1]!.text()).toContain('Alice')

      const firstTableRow = wrapper.findComponent({ name: 'UTable' }).vm.tableApi.getRowModel().rows[0]
      expect(firstTableRow.getValue('nom')).toBe('Johnson')
    })

    it('filters elements', async () => {
      const wrapper = await mountTable('secretariat')
      const input = wrapper.findComponent({ name: 'UInput' }).find('input')

      await input.setValue('johnson')
      expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
      expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Johnson')

      await input.setValue('pierre')
      expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
      expect(wrapper.findComponent({ name: 'UTable' }).text()).not.toContain('Doe')
      expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Aucune donnée disponible.')

      await input.setValue('')
      expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(2)
    })
  })
})
