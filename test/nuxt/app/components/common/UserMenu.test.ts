import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import UserMenu from '~/components/common/UserMenu.vue'
import PasswordUpdate from '~/components/common/PasswordUpdate.vue'

const { mockColorMode, mockNavigateTo, mockUserSession } = vi.hoisted(() => ({
  mockColorMode: {
    value: 'light',
    preference: 'light'
  },
  mockNavigateTo: vi.fn(),
  mockUserSession: {
    user: { value: { numId: '12345' } },
    clear: vi.fn()
  }
}))

mockNuxtImport('useColorMode', () => () => mockColorMode)
mockNuxtImport('useUserSession', () => () => mockUserSession)
mockNuxtImport('navigateTo', () => mockNavigateTo)

describe('UserMenu', () => {
  it('show button with name and button is not collapsed', async () => {
    const wrapper = await mountSuspended(UserMenu, { props: { collapsed: false } })

    const button = wrapper.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)

    expect(button.props('label')).toBe('Prénom Nom')
    expect(button.props('trailingIcon')).toBe('i-lucide-chevrons-up-down')
    expect(button.props('square')).toBeFalsy()
  })

  it('hide the name and adapt the button to square mode when collapsed is true', async () => {
    const wrapper = await mountSuspended(UserMenu, { props: { collapsed: true } })

    const button = wrapper.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)

    expect(button.props('label')).toBeUndefined()
    expect(button.props('trailingIcon')).toBeUndefined()
    expect(button.props('square')).toBe(true)
    expect(button.text()).toBe('PN')
  })

  it('init password modal as closed', async () => {
    const wrapper = await mountSuspended(UserMenu)

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(false)
  })

  it('opens password modal when selecting password item and closes on password-updated event', async () => {
    const wrapper = await mountSuspended(UserMenu)

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')
    const passwordItem = items[1][0]

    expect(passwordItem.label).toBe('Mot de passe')

    passwordItem.onSelect()
    await nextTick()

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.props('open')).toBe(true)

    const passwordUpdate = wrapper.findComponent(PasswordUpdate)
    expect(passwordUpdate.exists()).toBe(true)
    passwordUpdate.vm.$emit('password-updated')

    await nextTick()
    expect(wrapper.findComponent({ name: 'UModal' }).props('open')).toBe(false)
  })

  it('handles appearance preferences and logout actions correctly', async () => {
    const wrapper = await mountSuspended(UserMenu)

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')

    const apparenceItem = items[1][1]
    const clairItem = apparenceItem.children[0]

    const mockEventClair = { preventDefault: vi.fn() }
    clairItem.onSelect(mockEventClair)

    expect(mockEventClair.preventDefault).toHaveBeenCalled()
    expect(mockColorMode.preference).toBe('light')

    const sombreItem = apparenceItem.children[1]
    const mockEventSombre = { preventDefault: vi.fn() }

    sombreItem.onSelect(mockEventSombre)
    expect(mockEventSombre.preventDefault).toHaveBeenCalled()
    expect(mockColorMode.preference).toBe('dark')

    const logoutItem = items[2][0]
    await logoutItem.onSelect()
    expect(mockUserSession.clear).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/login')
  })

  it('check password modal opens and closes correctly', async () => {
    const wrapper = await mountSuspended(UserMenu)

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')
    const passwordItem = items[1][0]

    passwordItem.onSelect()
    await nextTick()

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.props('open')).toBe(true)

    modal.vm.$emit('update:open', false)
    await nextTick()
    expect(wrapper.findComponent({ name: 'UModal' }).props('open')).toBe(false)
  })
})
