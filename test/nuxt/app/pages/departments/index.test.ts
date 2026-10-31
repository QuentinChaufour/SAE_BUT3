import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'

import DepartmentsPage from '~/pages/departments/index.vue'
import DepartementsTable from '~/components/departments/DepartmentsTable.vue'
import DepartmentModal from '~/components/departments/DepartmentModal.vue'

const getDepartments = vi.fn(() => [{ idDepartement: 1, nom: 'Informatique' }])
registerEndpoint('/api/departments', getDepartments)

describe('Departments List', () => {
  it('check header components', async () => {
    const wrapper = await mountSuspended(DepartmentsPage)

    const dashboardPanel = wrapper.findComponent({ name: 'UDashboardPanel' })
    expect(dashboardPanel.exists()).toBe(true)

    const navbar = wrapper.findComponent({ name: 'UDashboardNavbar' })
    expect(navbar.exists()).toBe(true)
    expect(navbar.props('title')).toBe('Départements')

    const searchModal = wrapper.findComponent(DepartmentModal)
    expect(searchModal.exists()).toBe(true)

    const sidebarCollapse = wrapper.findComponent({ name: 'UDashboardSidebarCollapse' })
    expect(sidebarCollapse.exists()).toBe(true)
  })

  it('check body component', async () => {
    const wrapper = await mountSuspended(DepartmentsPage)

    const createModal = wrapper.findComponent(DepartementsTable)
    expect(createModal.exists()).toBe(true)
  })

  it('refreshes table when department is created/saved', async () => {
    const wrapper = await mountSuspended(DepartmentsPage)
    const callsBefore = getDepartments.mock.calls.length

    const searchModal = wrapper.findComponent(DepartmentModal)
    searchModal.vm.$emit('saved')

    await vi.waitFor(() => {
      expect(getDepartments).toHaveBeenCalledTimes(callsBefore + 1)
    })
  })
})
