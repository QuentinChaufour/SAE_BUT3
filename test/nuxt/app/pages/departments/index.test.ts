import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import DepartmentsPage from '~/pages/departments/index.vue'
import DepartementsTable from '~/components/departments/DepartmentsTable.vue'
import CreateDepartmentModal from '~/components/departments/CreateDepartmentModal.vue'

describe('Departments List', () => {
  it('check header components', async () => {
    const wrapper = await mountSuspended(DepartmentsPage)

    const dashboardPanel = wrapper.findComponent({ name: 'UDashboardPanel' })
    expect(dashboardPanel.exists()).toBe(true)

    const navbar = wrapper.findComponent({ name: 'UDashboardNavbar' })
    expect(navbar.exists()).toBe(true)
    expect(navbar.props('title')).toBe('Départements')

    const searchModal = wrapper.findComponent(CreateDepartmentModal)
    expect(searchModal.exists()).toBe(true)

    const sidebarCollapse = wrapper.findComponent({ name: 'UDashboardSidebarCollapse' })
    expect(sidebarCollapse.exists()).toBe(true)
  })

  it('check body component', async () => {
    const wrapper = await mountSuspended(DepartmentsPage)

    const createModal = wrapper.findComponent(DepartementsTable)
    expect(createModal.exists()).toBe(true)
  })
})
