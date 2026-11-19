import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import CompanyStudentSearchTable from '~/components/companies/CompanyStudentSearchTable.vue'
import { mountWithUApp } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({ useFetch: vi.fn(), useConnectedPersonnelStore: vi.fn() }))
mockNuxtImport('useFetch', () => mocks.useFetch)
mockNuxtImport('useConnectedPersonnelStore', () => mocks.useConnectedPersonnelStore)

describe('CompanyStudentSearchTable', () => {
  it('fetches searches for the company and department', async () => {
    mocks.useFetch.mockReturnValue({ data: ref([]) })
    mocks.useConnectedPersonnelStore.mockReturnValue({
      getSelectedDepartment: { departement: { id: 2 } },
      getCurrentYear: '2026-2027'
    })

    const wrapper = await mountWithUApp(CompanyStudentSearchTable, { idEntreprise: '7' })

    expect(mocks.useFetch).toHaveBeenCalledWith(
      '/api/companies/7/student-search?idDept=2&year=2026-2027',
      expect.any(String)
    )
    expect(wrapper.findComponent({ name: 'UTable' }).exists()).toBe(true)
  })

  it('renders student, formation and status columns', async () => {
    const searches = [
      {
        idRecherche: 1,
        dateCreation: '2026-10-20T10:00:00.000Z',
        titre: 'Développeur web',
        status: 'Accepte',
        Inscription: {
          Formation: { nomFormation: 'BUT Informatique' },
          Etudiant: { nom: 'Durand', prenom: 'Alice' }
        }
      },
      {
        idRecherche: 2,
        dateCreation: '2026-10-21T10:00:00.000Z',
        titre: 'Data analyst',
        status: 'AttenteReponse',
        Inscription: {
          Formation: { nomFormation: '' },
          Etudiant: { nom: 'Martin', prenom: 'Bob' }
        }
      }
    ]
    mocks.useFetch.mockReturnValue({ data: ref(searches) })
    mocks.useConnectedPersonnelStore.mockReturnValue({
      getSelectedDepartment: { departement: { id: 2 } },
      getCurrentYear: '2026-2027'
    })

    const wrapper = await mountWithUApp(CompanyStudentSearchTable, { idEntreprise: '7' })
    const table = wrapper.findComponent({ name: 'UTable' })
    const rows = table.findAll('tbody tr')

    expect(rows).toHaveLength(2)
    expect(table.text()).toContain('Durand')
    expect(table.text()).toContain('Alice')
    expect(table.text()).toContain('BUT Informatique')
    expect(table.text()).toContain('Développeur web')
    expect(table.text()).toContain('20/10/2026')
    expect(table.text()).toContain('N/A')

    await wrapper.findComponent({ name: 'UInput' }).find('input').setValue('Martin')
    expect(table.findAll('tbody tr')).toHaveLength(1)
    expect(table.text()).toContain('Data analyst')
  })

  it('exposes search fields and column accessors', async () => {
    const search = {
      idRecherche: 1,
      dateCreation: '2026-10-20T10:00:00.000Z',
      titre: 'Développeur web',
      status: 'Accepte',
      Inscription: {
        Formation: { nomFormation: 'BUT Informatique' },
        Etudiant: { nom: 'Durand', prenom: 'Alice' }
      }
    }
    mocks.useFetch.mockReturnValue({ data: ref([search]) })
    mocks.useConnectedPersonnelStore.mockReturnValue({
      getSelectedDepartment: { departement: { id: 2 } },
      getCurrentYear: '2026-2027'
    })

    const wrapper = await mountWithUApp(CompanyStudentSearchTable, { idEntreprise: '7' })
    const vm = wrapper.findComponent(CompanyStudentSearchTable).vm as unknown as {
      searchFields: (row: typeof search) => string[]
      columns: Array<{
        id?: string
        accessorKey?: string
        accessorFn?: (row: typeof search) => unknown
        cell?: (context: unknown) => unknown
      }>
    }

    expect(vm.searchFields(search)).toEqual(['Durand', 'Alice', 'BUT Informatique'])

    const dateColumn = vm.columns.find(column => column.id === 'date')
    expect(dateColumn?.accessorFn?.(search)).toBe(search.dateCreation)

    const nomColumn = vm.columns.find(column => column.id === 'nom')
    expect(nomColumn?.accessorFn?.(search)).toBe('Durand')

    const firstNameColumn = vm.columns.find(column => column.id === 'firstName')
    expect(firstNameColumn?.accessorFn?.(search)).toBe('Alice')

    const formationColumn = vm.columns.find(column => column.id === 'formation')
    expect(formationColumn?.accessorFn?.(search)).toBe('BUT Informatique')

    const missionColumn = vm.columns.find(column => column.id === 'Mission')
    expect(missionColumn?.accessorFn?.(search)).toBe('Développeur web')

    const statusColumn = vm.columns.find(column => column.accessorKey === 'status')
    expect(statusColumn).toBeDefined()
  })

  it('handles unavailable search data while loading', async () => {
    mocks.useFetch.mockReturnValue({ data: ref(null) })
    mocks.useConnectedPersonnelStore.mockReturnValue({
      getSelectedDepartment: { departement: { id: 2 } },
      getCurrentYear: '2026-2027'
    })

    const wrapper = await mountWithUApp(CompanyStudentSearchTable, { idEntreprise: '7' })

    expect(wrapper.findComponent({ name: 'UTable' }).exists()).toBe(true)
  })
})
