import { mountSuspended } from '@nuxt/test-utils/runtime'
import { vi } from 'vitest'
import type { Component } from 'vue'
import { h, defineComponent } from 'vue'
import { UApp } from '#components'
import type { User } from '#auth-utils'

export type NuxtMocks = {
  fetch?: ReturnType<typeof vi.fn>
  navigateTo?: ReturnType<typeof vi.fn>
  userSession?: ReturnType<typeof vi.fn>
  colorMode?: { value: string, preference: string }
  toast?: {
    add: ReturnType<typeof vi.fn>
  }
}

export type Wrapper = Awaited<ReturnType<typeof mountWithUApp>>

export function withUApp(component: Component, props?: Record<string, unknown>) {
  return defineComponent({
    setup() {
      return () => h(UApp, null, { default: () => h(component, props) })
    }
  })
}

export function mountWithUApp(component: Component, props?: Record<string, unknown>) {
  return mountSuspended(withUApp(component, props))
}

export function resetNuxtMocks(mocks: NuxtMocks) {
  mocks.fetch?.mockReset()
  mocks.navigateTo?.mockReset()
  mocks.userSession?.mockReset()
  mocks.toast?.add.mockReset()
}

export function mockUserSession(
  mock: ReturnType<typeof vi.fn>,
  user: User | null
) {
  const userRef = ref(user)
  const session = {
    loggedIn: computed(() => userRef.value !== null),
    user: userRef,
    fetch: vi.fn(),
    clear: vi.fn()
  }
  mock.mockReturnValue(session)
  return session
}
