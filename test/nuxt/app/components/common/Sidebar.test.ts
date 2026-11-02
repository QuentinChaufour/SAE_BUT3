import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import UserRole from '~~/shared/types/role.js'
import Sidebar from '~/components/common/Sidebar.vue'

const mockUser = ref<{ role: UserRole | string | undefined } | null>(null)

mockNuxtImport('useUserSession', () => {
  return () => ({ user: mockUser })
})

describe('Sidebar', () => {
  beforeEach(() => {
    mockUser.value = null
  })

  it('show links for a student', async () => {
    mockUser.value = { role: UserRole.Student }

    const wrapper = await mountSuspended(Sidebar)

    expect(wrapper.text()).toContain('Recherche de stages')
    expect(wrapper.text()).not.toContain('Tableau de bord')

    const navLinks = wrapper.findAll('a')
    const hrefs = navLinks.map(link => link.attributes('href'))

    expect(hrefs).toContain('/student/search/')
    expect(hrefs).not.toContain('/')
  })

  it('show links for a teacher', async () => {
    mockUser.value = { role: UserRole.Teacher }

    const wrapper = await mountSuspended(Sidebar)

    expect(wrapper.text()).not.toContain('Recherche de stages')
    expect(wrapper.text()).not.toContain('Enseignants')

    expect(wrapper.text()).toContain('Tableau de bord')
    expect(wrapper.text()).toContain('Étudiants')
    expect(wrapper.text()).toContain('Soutenances')

    const navLinks = wrapper.findAll('a')
    const hrefs = navLinks.map(link => link.attributes('href'))

    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/students/')
    expect(hrefs).toContain('/soutenances/')
    expect(hrefs).not.toContain('/student/search/')
  })

  it('show links for a secretary', async () => {
    mockUser.value = { role: UserRole.Secretary }

    const wrapper = await mountSuspended(Sidebar)

    expect(wrapper.text()).not.toContain('Recherche de stages')

    expect(wrapper.text()).toContain('Tableau de bord')
    expect(wrapper.text()).toContain('Étudiants')
    expect(wrapper.text()).toContain('Soutenances')
    expect(wrapper.text()).toContain('Enseignants')

    const navLinks = wrapper.findAll('a')
    const hrefs = navLinks.map(link => link.attributes('href'))

    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/students/')
    expect(hrefs).toContain('/soutenances/')
    expect(hrefs).toContain('/teachers/')
    expect(hrefs).not.toContain('/student/search/')
  })

  it('show links for an admin', async () => {
    mockUser.value = { role: UserRole.Admin }

    const wrapper = await mountSuspended(Sidebar)

    expect(wrapper.text()).not.toContain('Recherche de stages')
    expect(wrapper.text()).toContain('Départements')
    expect(wrapper.text()).toContain('Administrateurs')

    const navLinks = wrapper.findAll('a')
    const hrefs = navLinks.map(link => link.attributes('href'))

    expect(hrefs).toContain('/departments/')
    expect(hrefs).toContain('/admins/')
    expect(hrefs).not.toContain('/student/search/')
  })

  it('show no links for an unknown role', async () => {
    mockUser.value = { role: 'invalid-role' }

    const wrapper = await mountSuspended(Sidebar)

    expect(wrapper.text()).not.toContain('Recherche de stages')
    expect(wrapper.text()).not.toContain('Tableau de bord')
  })

  it('show no links for no role', async () => {
    mockUser.value = { role: undefined }

    const wrapper = await mountSuspended(Sidebar)

    expect(wrapper.text()).not.toContain('Recherche de stages')
    expect(wrapper.text()).not.toContain('Tableau de bord')
  })

  it('init the sidebar as open by default', async () => {
    mockUser.value = { role: UserRole.Student }

    const wrapper = await mountSuspended(Sidebar)

    const dashboardSidebar = wrapper.findComponent({ name: 'UDashboardSidebar' })

    expect(dashboardSidebar.exists()).toBe(true)
    expect(dashboardSidebar.props('open')).toBe(true)
  })

  it('check if sidebar can be closed', async () => {
    mockUser.value = { role: UserRole.Student }

    const wrapper = await mountSuspended(Sidebar)

    const dashboardSidebar = wrapper.findComponent({ name: 'UDashboardSidebar' })
    expect(dashboardSidebar.exists()).toBe(true)

    await dashboardSidebar.vm.$emit('update:open', false)
    expect(dashboardSidebar.props('open')).toBe(false)
  })
})
