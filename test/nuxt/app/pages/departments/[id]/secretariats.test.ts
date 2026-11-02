import { describe, it, expect } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import SecretariatsPage from '~/pages/departments/[id]/secretariats.vue'
import PersonnelsTable from '~/components/personnels/PersonnelsTable.vue'

const mockDepartmentData = {
  idDepartement: 1,
  nom: 'Informatique',
  DepartementTag: [{ idTag: 1, nomTag: 'Info' }]
}

registerEndpoint('/api/departments/1', () => mockDepartmentData)
registerEndpoint('/api/departments/2', () => {
  throw createError({
    statusCode: 404,
    statusMessage: 'Unknown department',
    fatal: true
  })
})

describe('Departments Secretariats Page', () => {
  it('check header components', async () => {
    const wrapper = await mountSuspended(SecretariatsPage, {
      route: { params: { id: '1' } }
    })

    const dashboardPanel = wrapper.findComponent({ name: 'UDashboardPanel' })
    expect(dashboardPanel.exists()).toBe(true)

    const navbar = wrapper.findComponent({ name: 'UDashboardNavbar' })
    expect(navbar.exists()).toBe(true)

    const sidebarCollapse = wrapper.findComponent({ name: 'UDashboardSidebarCollapse' })
    expect(sidebarCollapse.exists()).toBe(true)

    const breadcrumb = wrapper.findComponent({ name: 'UBreadcrumb' })
    expect(breadcrumb.exists()).toBe(true)
    expect(breadcrumb.props('items')).toEqual([
      { label: 'Départements', to: '/departments' },
      { label: 'Secrétariats', to: '/departments/1/secretariats' }
    ])
  })

  it('check body component', async () => {
    const wrapper = await mountSuspended(SecretariatsPage, {
      route: { params: { id: '1' } }
    })

    const personnelsTable = wrapper.findComponent(PersonnelsTable)
    expect(personnelsTable.exists()).toBe(true)
    expect(personnelsTable.props('type')).toBe('secretariat')
  })

  it('check error if department not found', async () => {
    const wrapper = await mountSuspended(SecretariatsPage, {
      route: { params: { id: '2' } }
    })

    expect(wrapper.findComponent(PersonnelsTable).exists()).toBe(false)
    expect(useError().value).toMatchObject({ statusCode: 404 })
  })
})
