import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConfirmModal from '~/components/common/ConfirmModal.vue'
import StudentSearchTable from '~/components/student/search/StudentSearchTable.vue'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  fetch: vi.fn(),
  refresh: vi.fn(),
  toast: {
    add: vi.fn()
  }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useFetch', () => mocks.useFetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const searches = [
  {
    idRecherche: 1,
    titre: 'Développeur web',
    dateDerniereModification: '2026-10-20T10:00:00.000Z',
    alternance: true,
    status: 'AttenteReponse',
    Entreprise: { nom: 'EntrepriseA', ville: 'Paris' },
    DepartementTagRecherche: [{ DepartementTag: { nomTag: 'Web' } }]
  },
  {
    idRecherche: 2,
    titre: 'Data analyst',
    dateDerniereModification: '2026-10-21T10:00:00.000Z',
    alternance: false,
    status: 'Accepte',
    Entreprise: { nom: 'EntrepriseB', ville: null },
    DepartementTagRecherche: []
  }
]

describe('StudentSearchTable', () => {
  beforeEach(() => {
    mocks.useFetch.mockReturnValue({
      data: ref(searches),
      refresh: mocks.refresh
    })
  })

  it('renders rows and cell values', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })

    expect(mocks.useFetch).toHaveBeenCalledWith('/api/students/o123456789/search', expect.any(String))
    const rows = wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')

    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('EntrepriseA')
    expect(rows[0]!.text()).toContain('Paris')
    expect(rows[0]!.text()).toContain('Oui')
    expect(rows[0]!.text()).toContain('Web')

    expect(rows[1]!.text()).toContain('Data analyst')
    expect(rows[1]!.text()).toContain('EntrepriseB')
    expect(rows[1]!.text()).toContain('N/A')
    expect(rows[1]!.text()).toContain('Non')

    const firstTableRow = wrapper.findComponent({ name: 'UTable' }).vm.tableApi.getRowModel().rows[0]
    expect(firstTableRow.getValue('ville')).toBe('Paris')
    expect(firstTableRow.getValue('tags')).toEqual(['Web'])
  })

  it('check content', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })

    const searchbar = wrapper.findComponent({ name: 'UInput' })
    expect(searchbar.exists()).toBe(true)
    expect(searchbar.find('input').attributes('placeholder')).toBe('Rechercher parmi les recherches...')

    const table = wrapper.findComponent({ name: 'UTable' })
    expect(table.exists()).toBe(true)

    const tableHeader = table.find('thead')
    expect(tableHeader.exists()).toBe(true)

    const headers = ['Date MàJ', 'Entreprise', 'Titre', 'Ville', 'Status', 'Etiquettes', 'Alternance', '']

    const headerCells = tableHeader.findAll('th')
    expect(headerCells.length).toBe(headers.length)
    for (let i = 0; i < headers.length; i++) {
      expect(headerCells[i]!.text()).toBe(headers[i])
    }

    const pagination = wrapper.findComponent({ name: 'UPagination' })
    expect(pagination.exists()).toBe(true)
  })

  it('filters elements', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })
    const input = wrapper.findComponent({ name: 'UInput' }).find('input')

    await input.setValue('  WEB paris  ')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Développeur web')

    await input.setValue('web orléans')
    expect(wrapper.findComponent({ name: 'UTable' }).text()).not.toContain('Développeur web')
    expect(wrapper.findComponent({ name: 'UTable' }).text()).toContain('Aucune donnée disponible.')

    await input.setValue('')
    expect(wrapper.findComponent({ name: 'UTable' }).findAll('tbody tr')).toHaveLength(2)
  })

  it('emits edit action', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })
    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[0]?.label === 'Modifier'
    })
    expect(dropdown).toBeDefined()
    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]

    actions[0]![0]!.onSelect()
    expect(wrapper.emitted('edit')?.[0]).toEqual([searches[0]])
  })

  it('check read-only mode', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789', readOnly: true } })
    const viewButton = wrapper.find('button[aria-label="Voir"]')

    expect(viewButton.exists()).toBe(true)
    await viewButton.trigger('click')
    expect(wrapper.emitted('edit')?.[0]).toEqual([searches[0]])

    expect(wrapper.find('button[aria-label="Actions"]').exists()).toBe(false)
  })

  it('updates pagination and sorting', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })
    const table = wrapper.findComponent({ name: 'UTable' })
    const pagination = wrapper.findComponent({ name: 'UPagination' })

    expect(pagination.props('page')).toBe(1)

    pagination.vm.$emit('update:page', 2)
    await nextTick()
    expect(pagination.props('page')).toBe(2)

    const sortHeader = table.findAll('th button')[0]!
    const sortMenu = wrapper.findAllComponents({ name: 'UDropdownMenu' })[0]!
    const getSortItems = () => sortMenu.props('items') as { label: string, onSelect: () => void }[]

    getSortItems()[0]!.onSelect()
    await nextTick()
    expect(sortHeader.attributes('aria-label')).toBe('Trier par décroissant')

    getSortItems()[0]!.onSelect()
    await nextTick()
    expect(sortHeader.attributes('aria-label')).toBe('Trier par croissant')

    getSortItems()[1]!.onSelect()
    await nextTick()
    expect(sortHeader.attributes('aria-label')).toBe('Trier par croissant')

    getSortItems()[1]!.onSelect()
    await nextTick()
    expect(sortHeader.attributes('aria-label')).toBe('Trier par croissant')
  })

  it('opens delete modal with selected search', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })

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
    expect(modal.props('title')).toBe('Supprimer la recherche')
    expect(modal.props('description')).toContain('Êtes-vous sûr de vouloir supprimer la recherche Développeur web ? L\'ensemble des éléments liés (fichiers, contacts, etc.) seront supprimés. Cette action est irréversible.')
  })

  it('deletes search on modal confirm', async () => {
    mocks.fetch.mockResolvedValueOnce(undefined)
    mocks.refresh.mockResolvedValueOnce(undefined)

    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Supprimer'
    })

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![1]!.onSelect()

    const modal = wrapper.findComponent(ConfirmModal)
    modal.vm.$emit('confirm')

    expect(mocks.fetch).toHaveBeenCalledWith(
      '/api/students/o123456789/search/1',
      { method: 'DELETE' }
    )

    await vi.waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledTimes(1)
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Recherche supprimée',
        description: 'La recherche Développeur web a été supprimée avec succès.',
        color: 'success'
      })
    })
  })

  it('network error on deletes search on modal confirm', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })
    mocks.fetch.mockRejectedValueOnce(new Error('Network error'))

    const dropdown = wrapper.findAllComponents({ name: 'UDropdownMenu' }).find((menu) => {
      const items = menu.props('items') as { label: string, onSelect: () => void }[][]
      return items[0]?.[1]?.label === 'Supprimer'
    })

    const actions = dropdown!.props('items') as { label: string, onSelect: () => void }[][]
    actions[0]![1]!.onSelect()

    const modal = wrapper.findComponent(ConfirmModal)
    modal.vm.$emit('confirm')

    expect(mocks.fetch).toHaveBeenCalledWith(
      '/api/students/o123456789/search/1',
      { method: 'DELETE' }
    )

    await vi.waitFor(() => {
      expect(mocks.toast.add).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression de la recherche Développeur web.',
        color: 'error'
      })
    })
  })

  it('closes delete modal on cancel', async () => {
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })

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
    const wrapper = await mountSuspended(StudentSearchTable, { props: { etudiantId: 'o123456789' } })

    const modal = wrapper.findComponent(ConfirmModal)
    modal.vm.$emit('confirm')

    await nextTick()

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(mocks.toast.add).not.toHaveBeenCalled()
  })
})
