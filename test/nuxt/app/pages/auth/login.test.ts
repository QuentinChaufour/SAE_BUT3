import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import login from '~/pages/auth/login.vue'
import { resetNuxtMocks } from '../../../utils/utils'
import UserRole from '~~/shared/types/role'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  navigateTo: vi.fn(),
  getRoleRedirectPath: vi.fn(),
  toast: {
    add: vi.fn()
  },
  session: {
    fetch: vi.fn(),
    user: { value: null as { role: UserRole } | null }
  },
  route: { query: {} as Record<string, unknown> }
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('navigateTo', () => mocks.navigateTo)
mockNuxtImport('useToast', () => () => mocks.toast)
mockNuxtImport('useUserSession', () => () => mocks.session)
mockNuxtImport('useRoute', () => () => mocks.route)
mockNuxtImport('definePageMeta', () => vi.fn())

vi.mock('~~/shared/const/redirect', () => ({
  getRoleRedirectPath: mocks.getRoleRedirectPath
}))

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

describe('login', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
    mocks.session.user.value = { role: UserRole.Student }
    mocks.route.query = {}
    mocks.getRoleRedirectPath.mockReturnValue('/example')
  })

  function mountLogin() {
    return mount(login, {
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

  it('fail POST the login credentials to the API - success: false', async () => {
    // ensure the API reject the login
    mocks.fetch.mockResolvedValue({ success: false })

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

  it('fail POST the login credentials to the API - no success field', async () => {
    // ensure the API reject the login
    mocks.fetch.mockResolvedValue({ })

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

  describe('getRedirectPath', () => {
    async function submitLogin() {
      mocks.fetch.mockResolvedValue({ success: true })

      const wrapper = mountLogin()
      const authForm = wrapper.findComponent({ name: 'UAuthForm' })

      await authForm.vm.$emit('submit', {
        data: {
          login: 'o00000001',
          password: 'password123'
        }
      })
    }

    it('redirects to the "redirect" query param', async () => {
      mocks.route.query = { redirect: '/student/search' }

      await submitLogin()

      expect(mocks.navigateTo).toHaveBeenCalledWith('/student/search')
      expect(mocks.getRoleRedirectPath).not.toHaveBeenCalled()
    })

    it('redirects to the role path when there is no "redirect" query param', async () => {
      mocks.route.query = {}

      await submitLogin()

      expect(mocks.getRoleRedirectPath).toHaveBeenCalledWith('student')
      expect(mocks.navigateTo).toHaveBeenCalledWith('/example')
    })

    it('redirects to the role path when "redirect" is an empty string', async () => {
      mocks.route.query = { redirect: '' }

      await submitLogin()

      expect(mocks.navigateTo).toHaveBeenCalledWith('/example')
    })

    it('uses the role of the connected user to compute the role path', async () => {
      mocks.session.user.value = { role: UserRole.Teacher }

      await submitLogin()

      expect(mocks.getRoleRedirectPath).toHaveBeenCalledWith('teacher')
    })

    it('does not redirect when the login fails', async () => {
      mocks.fetch.mockResolvedValue({ success: false })

      const wrapper = mountLogin()
      await wrapper.findComponent({ name: 'UAuthForm' }).vm.$emit('submit', {
        data: { login: 'o00000001', password: 'password123' }
      })

      expect(mocks.navigateTo).not.toHaveBeenCalled()
    })
  })
})
