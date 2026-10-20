import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Password from '~/pages/auth/Password.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  navigateTo: vi.fn(),
  toast: {
    add: vi.fn()
  }
}))

// mock nuxt auto-imports
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)
mockNuxtImport('definePageMeta', () => vi.fn())
mockNuxtImport('navigateTo', () => mocks.navigateTo)

// the form with filled values
const UAuthFormStub = {
  name: 'UAuthForm',
  props: ['schema'],
  emits: ['submit'],
  template: `
    <form @submit.prevent="$emit('submit', {
      data: {
        login: 'o00000001',
        oldPassword: 'password123',
        newPassword: 'newPassword'
      }
    })">
      <button type="submit">Modifier</button>
    </form>
  `
}

describe('Password.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountPassword() {
    return mount(Password, {
      global: {
        stubs: {
          UAuthForm: UAuthFormStub
        }
      }
    })
  }

  it('POSTs the password change credentials to the API', async () => {
    mocks.fetch.mockResolvedValue({ success: true })
    mocks.navigateTo.mockResolvedValue(undefined)

    const wrapper = mountPassword()
    const authForm = wrapper.findComponent({ name: 'UAuthForm' })

    expect(authForm.exists()).toBe(true)

    await authForm.vm.$emit('submit', {
      data: {
        login: 'o00000001',
        oldPassword: 'password123',
        newPassword: 'newPassword'
      }
    })

    await flushPromises()

    expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/password', {
      method: 'POST',
      body: {
        login: 'o00000001',
        oldPassword: 'password123',
        newPassword: 'newPassword'
      }
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'success',
      title: 'Connexion réussi !'
    })

    expect(mocks.navigateTo).toHaveBeenCalledWith('/auth/login')
  })

  it('displays an error when the password change request fails', async () => {
    mocks.fetch.mockRejectedValue(new Error('Unauthorised'))

    const wrapper = mountPassword()
    const authForm = wrapper.findComponent({ name: 'UAuthForm' })

    expect(authForm.exists()).toBe(true)

    await authForm.vm.$emit('submit', {
      data: {
        login: 'o00000001',
        oldPassword: 'password123',
        newPassword: 'newPassword'
      }
    })

    await flushPromises()

    expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/password', {
      method: 'POST',
      body: {
        login: 'o00000001',
        oldPassword: 'password123',
        newPassword: 'newPassword'
      }
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Connexion échoué !'
    })

    expect(mocks.navigateTo).not.toHaveBeenCalled()
  })

  it('rejects the new password when it matches the old password', () => {
    const wrapper = mountPassword()
    const authForm = wrapper.findComponent({ name: 'UAuthForm' })
    const schema = authForm.props('schema')

    const result = schema.safeParse({
      login: 'o00000001',
      oldPassword: 'password123',
      newPassword: 'password123'
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues).toContainEqual({
        code: 'custom',
        path: ['newPassword'],
        message: 'Le nouveau et l\'ancien mot de passe doivent être différent.'
      })
    }
  })
})
