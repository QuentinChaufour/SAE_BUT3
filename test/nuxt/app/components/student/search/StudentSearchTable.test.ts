import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import StudentSearchTable from '~/components/student/search/StudentSearchTable.vue'

describe('StudentSearchTable', () => {
  it('check content', async () => {
    const wrapper = await mountSuspended(StudentSearchTable)

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
})
