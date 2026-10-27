import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { vi } from 'vitest'
import type { Component } from 'vue'
import { h, defineComponent } from 'vue'
import { UApp } from '#components'

export type NuxtMocks = {
  fetch: ReturnType<typeof vi.fn>
  navigateTo?: ReturnType<typeof vi.fn>
  toast: {
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
  mocks.fetch.mockReset()
  mocks.navigateTo?.mockReset()
  mocks.toast.add.mockReset()
}
