import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Login from '~/pages/auth/Login.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toast: {
    add: vi.fn()
  }
}))

// mock nuxt auto-imports
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)
mockNuxtImport('definePageMeta', () => vi.fn())

// the form with filled values
const UAuthFormStub = {
  name: 'UAuthForm',
  emits: ['submit'],
  template: `
    <form @submit.prevent="$emit('submit', {
      data: {
        login: 'o00000001',
        password: 'password123'
      }
    })">
      <button type="submit">Connexion</button>
    </form>
  `
}

describe('Login.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountLogin() {
    return mount(Login, {
      global: {
        stubs: {
          UAuthForm: UAuthFormStub
        }
      }
    })
  }

  it('POST the login credentials to the API', async () => {
    // ensure the API response is success
    mocks.fetch.mockResolvedValue({ success: true })

    // mount the page & extract the component
    const wrapper = mountLogin()
    const authForm = wrapper.findComponent({ name: 'UAuthForm' })

    expect(authForm.exists()).toBe(true)

    // emit a submit form event
    await authForm.vm.$emit('submit', {
      data: {
        login: 'o00000001',
        password: 'password123'
      }
    })

    await flushPromises()

    // check that the API is called with the form values
    expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        login: 'o00000001',
        password: 'password123'
      }
    })

    // check the right toast have been called
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Connexion réussi !'
    })
  })

  it('fail POST the login credentials to the API', async () => {
    // ensure the API reject the login
    mocks.fetch.mockRejectedValue(new Error('Unauthorised'))

    // mount the page & extract the component
    const wrapper = mountLogin()
    const authForm = wrapper.findComponent({ name: 'UAuthForm' })

    expect(authForm.exists()).toBe(true)

    // submit form values to API
    await authForm.vm.$emit('submit', {
      data: {
        login: 'o00000001',
        password: 'password123'
      }
    })

    await flushPromises()

    // check that the right values have been used
    expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: {
        login: 'o00000001',
        password: 'password123'
      }
    })

    // check that the error toast have been used
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Connexion échoué !'
    })
  })
})
