import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { DropdownMenuItem } from '@nuxt/ui'
import { UButton } from '#components'
import StudentFormationSwitcher from '~/components/common/sidebar/StudentFormationSwitcher.vue'

const { storeMock, reloadNuxtAppMock } = vi.hoisted(() => ({
  storeMock: {
    getSelectedPromotion: null as APIConnectedStudent | null,
    getPromotions: [] as APIConnectedStudent[],
    setSelectedPromotion: vi.fn()
  },
  reloadNuxtAppMock: vi.fn()
}))

mockNuxtImport('useConnectedStudentStore', () => () => storeMock)
mockNuxtImport('reloadNuxtApp', () => reloadNuxtAppMock)

const but2 = { idInscription: 1, annee: '2025-2026', formation: { nom: 'BUT2 Informatique', departement: 'Informatique' }, readOnly: true }
const but3 = { idInscription: 2, annee: '2026-2027', formation: { nom: 'BUT3 Informatique', departement: 'Informatique' }, readOnly: false }

function setStore(promotions: APIConnectedStudent[] = [but2, but3], selected: APIConnectedStudent | null = but3) {
  storeMock.getPromotions = promotions
  storeMock.getSelectedPromotion = selected
}

async function mountSwitcher(collapsed = false) {
  const wrapper = await mountSuspended(StudentFormationSwitcher, { props: { collapsed } })

  const menu = wrapper.findComponent({ name: 'UDropdownMenu' })
  const button = wrapper.findComponent(UButton)

  return {
    wrapper,
    menu,
    button,
    items: menu.props('items') as DropdownMenuItem[][]
  }
}

describe('StudentFormationSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStore()
  })

  it('show a single dropdown menu with its button', async () => {
    const { wrapper } = await mountSwitcher()

    expect(wrapper.findAllComponents({ name: 'UDropdownMenu' })).toHaveLength(1)
    expect(wrapper.findAllComponents(UButton)).toHaveLength(1)
  })

  it('show the selected formation name when expanded', async () => {
    const { wrapper, button } = await mountSwitcher()

    expect(wrapper.text()).toContain('BUT3 Informatique')
    expect(button.props('label')).toBe('BUT3 Informatique')
    expect(button.props('trailingIcon')).toBe('mi:switch')
    expect(button.props('square')).toBe(false)
  })

  it('show only an icon when collapsed', async () => {
    const { wrapper, button } = await mountSwitcher(true)

    expect(wrapper.text()).not.toContain('BUT3 Informatique')
    expect(button.props('label')).toBeUndefined()
    expect(button.props('trailingIcon')).toBe('lucide:school')
    expect(button.props('square')).toBe(true)
  })

  it('show an item for each promotion with its year as description', async () => {
    const { items } = await mountSwitcher()

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject([
      { type: 'label', label: 'Promotion' },
      { type: 'separator' },
      { type: 'checkbox', label: 'BUT2 Informatique', description: '2025-2026' },
      { type: 'checkbox', label: 'BUT3 Informatique', description: '2026-2027' }
    ])
  })

  it('show only the selected promotion as checked', async () => {
    setStore(undefined, but2)

    const { items } = await mountSwitcher()
    const promotions = items[0]!.filter(item => item.type === 'checkbox')

    expect(promotions.map(p => [p.label, p.checked])).toEqual([
      ['BUT2 Informatique', true],
      ['BUT3 Informatique', false]
    ])
  })

  it('check promotions by idInscription and not by formation name', async () => {
    const sameFormationOtherYear = { idInscription: 3, annee: '2027-2028', readOnly: true, formation: { nom: 'BUT3 Informatique', departement: 'Informatique' } }
    setStore([but3, sameFormationOtherYear], sameFormationOtherYear)

    const { items } = await mountSwitcher()
    const promotions = items[0]!.filter(item => item.type === 'checkbox')

    expect(promotions.map(p => [p.description, p.checked])).toEqual([
      ['2026-2027', false],
      ['2027-2028', true]
    ])
  })

  it('check if selecting a promotion updates the store and reloads the app', async () => {
    const { items } = await mountSwitcher()
    const item = items[0]!.find(i => i.label === 'BUT2 Informatique')!

    item.onSelect!(new Event('select'))

    expect(storeMock.setSelectedPromotion).toHaveBeenCalledOnce()
    expect(storeMock.setSelectedPromotion).toHaveBeenCalledWith(but2)
    expect(reloadNuxtAppMock).toHaveBeenCalledOnce()
  })

  it('check if the promotion is set before reloading the app', async () => {
    const { items } = await mountSwitcher()
    const item = items[0]!.find(i => i.label === 'BUT2 Informatique')!

    item.onSelect!(new Event('select'))

    const setOrder = storeMock.setSelectedPromotion.mock.invocationCallOrder[0]!
    const reloadOrder = reloadNuxtAppMock.mock.invocationCallOrder[0]!
    expect(setOrder).toBeLessThan(reloadOrder)
  })
})
