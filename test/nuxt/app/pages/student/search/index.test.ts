import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

import StudentSearchPage from '~/pages/student/search/index.vue'
import StudentSearchTable from '~/components/student/search/StudentSearchTable.vue'
import CreateSearchModal from '~/components/student/search/CreateSearchModal.vue'

describe('Student Search Index Page', () => {
  it('check header components', async () => {
    const wrapper = await mountSuspended(StudentSearchPage)

    const dashboardPanel = wrapper.findComponent({ name: 'UDashboardPanel' })
    expect(dashboardPanel.exists()).toBe(true)

    const navbar = wrapper.findComponent({ name: 'UDashboardNavbar' })
    expect(navbar.exists()).toBe(true)
    expect(navbar.props('title')).toBe('Recherche de stages')

    const searchModal = wrapper.findComponent(CreateSearchModal)
    expect(searchModal.exists()).toBe(true)

    const sidebarCollapse = wrapper.findComponent({ name: 'UDashboardSidebarCollapse' })
    expect(sidebarCollapse.exists()).toBe(true)
  })

  it('check body component', async () => {
    const wrapper = await mountSuspended(StudentSearchPage)

    const createModal = wrapper.findComponent(StudentSearchTable)
    expect(createModal.exists()).toBe(true)
  })
})
