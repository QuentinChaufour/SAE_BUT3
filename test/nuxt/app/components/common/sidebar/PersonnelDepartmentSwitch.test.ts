import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { DropdownMenuItem } from '@nuxt/ui'
import { UButton } from '#components'
import PersonnelDepartmentSwitcher from '~/components/common/sidebar/PersonnelDepartmentSwitcher.vue'

const { storeMock, reloadNuxtAppMock } = vi.hoisted(() => ({
  storeMock: {
    getSelectedDepartment: null as APIConnectedPersonnel | null,
    getDepartments: [] as APIConnectedPersonnel[],
    getCurrentYear: undefined as string | undefined,
    setSelectedDepartment: vi.fn(),
    setCurrentYear: vi.fn()
  },
  reloadNuxtAppMock: vi.fn()
}))

mockNuxtImport('useConnectedPersonnelStore', () => () => storeMock)
mockNuxtImport('reloadNuxtApp', () => reloadNuxtAppMock)

const deptInfo = { departement: { id: 1, nom: 'Informatique' }, annees: ['2024-2025', '2025-2026', '2026-2027'] }
const deptChimie = { departement: { id: 2, nom: 'Chimie' }, annees: ['2026-2027'] }

function setStore(options: {
  departments?: APIConnectedPersonnel[]
  selected?: APIConnectedPersonnel
  year?: string
} = {}) {
  storeMock.getDepartments = options.departments ?? [deptInfo, deptChimie]
  storeMock.getSelectedDepartment = options.selected === undefined ? deptInfo : options.selected
  storeMock.getCurrentYear = 'year' in options ? options.year : '2026-2027'
}

async function mountSwitcher(collapsed = false) {
  const wrapper = await mountSuspended(PersonnelDepartmentSwitcher, { props: { collapsed } })

  const [yearsMenu, departmentsMenu] = wrapper.findAllComponents({ name: 'UDropdownMenu' })
  const [yearsButton, departmentsButton] = wrapper.findAllComponents(UButton)

  return {
    wrapper,
    yearsMenu: yearsMenu!,
    departmentsMenu: departmentsMenu!,
    yearsButton: yearsButton!,
    departmentsButton: departmentsButton!,
    yearsItems: yearsMenu!.props('items') as DropdownMenuItem[][],
    departmentsItems: departmentsMenu!.props('items') as DropdownMenuItem[][]
  }
}

describe('PersonnelDepartmentSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStore()
  })

  it('check components', async () => {
    const { wrapper } = await mountSwitcher()

    expect(wrapper.findAllComponents({ name: 'UDropdownMenu' })).toHaveLength(2)
    expect(wrapper.findAllComponents(UButton)).toHaveLength(2)
  })

  it('show the current year and the selected department when expanded', async () => {
    const { wrapper, yearsButton, departmentsButton } = await mountSwitcher()

    expect(wrapper.text()).toContain('2026-2027')
    expect(wrapper.text()).toContain('Informatique')

    expect(yearsButton.props('label')).toBe('2026-2027')
    expect(yearsButton.props('trailingIcon')).toBe('mi:switch')
    expect(yearsButton.props('square')).toBe(false)

    expect(departmentsButton.props('label')).toBe('Informatique')
    expect(departmentsButton.props('trailingIcon')).toBe('mi:switch')
    expect(departmentsButton.props('square')).toBe(false)
  })

  it('show only icons when collapsed', async () => {
    const { wrapper, yearsButton, departmentsButton } = await mountSwitcher(true)

    expect(wrapper.text()).not.toContain('2026-2027')
    expect(wrapper.text()).not.toContain('Informatique')

    expect(yearsButton.props('label')).toBeUndefined()
    expect(yearsButton.props('trailingIcon')).toBe('lucide:calendar')
    expect(yearsButton.props('square')).toBe(true)

    expect(departmentsButton.props('label')).toBeUndefined()
    expect(departmentsButton.props('trailingIcon')).toBe('lucide:school')
    expect(departmentsButton.props('square')).toBe(true)
  })

  it('show an item for each year of the selected department', async () => {
    const { yearsItems } = await mountSwitcher()

    expect(yearsItems).toHaveLength(1)
    expect(yearsItems[0]).toMatchObject([
      { type: 'label', label: 'Année' },
      { type: 'separator' },
      { type: 'checkbox', label: '2024-2025' },
      { type: 'checkbox', label: '2025-2026' },
      { type: 'checkbox', label: '2026-2027' }
    ])
  })

  it('show only the current year as checked', async () => {
    setStore({ year: '2025-2026' })

    const { yearsItems } = await mountSwitcher()
    const years = yearsItems[0]!.filter(item => item.type === 'checkbox')

    expect(years.map(y => [y.label, y.checked])).toEqual([
      ['2024-2025', false],
      ['2025-2026', true],
      ['2026-2027', false]
    ])
  })

  it('check if selecting a year updates the store and reloads the app', async () => {
    const { yearsItems } = await mountSwitcher()
    const item = yearsItems[0]!.find(i => i.label === '2026-2027')!

    item.onSelect!(new Event(''))

    expect(storeMock.setCurrentYear).toHaveBeenCalledOnce()
    expect(storeMock.setCurrentYear).toHaveBeenCalledWith('2026-2027')
    expect(reloadNuxtAppMock).toHaveBeenCalledOnce()
    expect(storeMock.setSelectedDepartment).not.toHaveBeenCalled()
  })

  it('show an item for each department', async () => {
    const { departmentsItems } = await mountSwitcher()

    expect(departmentsItems).toHaveLength(1)
    expect(departmentsItems[0]).toMatchObject([
      { type: 'label', label: 'Département' },
      { type: 'separator' },
      { type: 'checkbox', label: 'Informatique' },
      { type: 'checkbox', label: 'Chimie' }
    ])
  })

  it('show only the selected department as checked', async () => {
    setStore({ selected: deptChimie })

    const { departmentsItems } = await mountSwitcher()
    const departments = departmentsItems[0]!.filter(item => item.type === 'checkbox')

    expect(departments.map(d => [d.label, d.checked])).toEqual([
      ['Informatique', false],
      ['Chimie', true]
    ])
  })

  it('check if selecting a department updates the store and reloads the app', async () => {
    const { departmentsItems } = await mountSwitcher()
    const item = departmentsItems[0]!.find(i => i.label === 'Chimie')!

    item.onSelect!(new Event(''))

    expect(storeMock.setSelectedDepartment).toHaveBeenCalledOnce()
    expect(storeMock.setSelectedDepartment).toHaveBeenCalledWith(deptChimie)
    expect(reloadNuxtAppMock).toHaveBeenCalledOnce()
    expect(storeMock.setCurrentYear).not.toHaveBeenCalled()
  })

  it('check if the department is set before reloading the app', async () => {
    const { departmentsItems } = await mountSwitcher()
    const item = departmentsItems[0]!.find(i => i.label === 'Chimie')!

    item.onSelect!(new Event(''))

    const setOrder = storeMock.setSelectedDepartment.mock.invocationCallOrder[0]!
    const reloadOrder = reloadNuxtAppMock.mock.invocationCallOrder[0]!
    expect(setOrder).toBeLessThan(reloadOrder)
  })
})
