import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Dashboard from '~/pages/secretariat/dashboard.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn()
}))

mockNuxtImport('$fetch', () => mocks.fetch)

const ClassCardStub = {
  name: 'ClassCard',
  props: ['class_name', 'alternance', 'nb_etudiants', 'nb_stages'],
  template: '<div />'
}

const SoutenanceCardStub = {
  name: 'SoutenanceCard',
  props: ['class_name', 'alternance', 'stages', 'soutenances'],
  template: '<div />'
}

const TableSoutenancesStub = {
  name: 'TableSoutenances',
  props: ['departementId'],
  template: '<div />'
}

describe('secretariat/dashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetch.mockImplementation((url: string) => {
      if (url === '/api/classes/summary/stages') {
        return Promise.resolve([
          {
            name: 'Informatique',
            etudiants: 24,
            stages: 18,
            alternance: false
          },
          {
            name: null,
            etudiants: 12,
            stages: 10,
            alternance: true
          }
        ])
      }

      return Promise.resolve([
        {
          name: 'Informatique',
          alternance: false,
          stages: 18,
          soutenances: 15
        },
        {
          name: null,
          alternance: true,
          stages: 10,
          soutenances: 8
        }
      ])
    })
  })

  it('loads dashboard data for department 1 and renders the cards', async () => {
    const wrapper = mount({
      components: { Dashboard },
      template: '<Suspense><Dashboard /></Suspense>'
    }, {
      global: {
        stubs: {
          ClassCard: ClassCardStub,
          SoutenanceCard: SoutenanceCardStub,
          TableSoutenances: TableSoutenancesStub,
          UDashboardPanel: { template: '<div><slot name="body" /><slot name="header" /></div>' },
          UDashboardNavbar: { template: '<div><slot name="leading" /></div>' },
          UDashboardSidebarCollapse: { template: '<button />' },
          UCard: { template: '<div><slot /></div>' }
        }
      }
    })

    await flushPromises()

    expect(mocks.fetch).toHaveBeenNthCalledWith(1, '/api/classes/summary/stages', {
      query: { idDepartement: 1 }
    })
    expect(mocks.fetch).toHaveBeenNthCalledWith(2, '/api/classes/summary/soutenances', {
      query: { idDepartement: 1 }
    })

    const classCards = wrapper.findAllComponents({ name: 'ClassCard' })
    expect(classCards).toHaveLength(2)
    expect(classCards[0].props()).toMatchObject({
      class_name: 'Informatique',
      alternance: false,
      nb_etudiants: 24,
      nb_stages: 18
    })
    expect(classCards[1].props('class_name')).toBe('Formation sans nom')

    const soutenanceCards = wrapper.findAllComponents({ name: 'SoutenanceCard' })
    expect(soutenanceCards).toHaveLength(2)
    expect(soutenanceCards[0].props()).toMatchObject({
      class_name: 'Informatique',
      alternance: false,
      stages: 18,
      soutenances: 15
    })
    expect(soutenanceCards[1].props('class_name')).toBe('Formation sans nom')

    const table = wrapper.findComponent({ name: 'TableSoutenances' })
    expect(table.props('departementId')).toBe('1')
  })

  it('uses fallback labels when rendered data contains null names', async () => {
    const wrapper = mount({
      components: { Dashboard },
      template: '<Suspense><Dashboard /></Suspense>'
    }, {
      global: {
        stubs: {
          ClassCard: ClassCardStub,
          SoutenanceCard: SoutenanceCardStub,
          TableSoutenances: TableSoutenancesStub,
          UDashboardPanel: { template: '<div><slot name="body" /><slot name="header" /></div>' },
          UDashboardNavbar: { template: '<div><slot name="leading" /></div>' },
          UDashboardSidebarCollapse: { template: '<button />' },
          UCard: { template: '<div><slot /></div>' }
        }
      }
    })

    await flushPromises()

    const dashboard = wrapper.findComponent(Dashboard)
    Reflect.set(dashboard.vm, 'classes', [{
      name: null,
      etudiants: 1,
      stages: 1,
      alternance: false
    }])
    Reflect.set(dashboard.vm, 'soutenances', [{
      name: null,
      alternance: false,
      stages: 1,
      soutenances: 1
    }])
    await dashboard.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'ClassCard' }).props('class_name')).toBe('Formation sans nom')
    expect(wrapper.findComponent({ name: 'SoutenanceCard' }).props('class_name')).toBe('Formation sans nom')
  })
})
