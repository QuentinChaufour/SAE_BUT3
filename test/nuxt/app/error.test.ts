import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ErrorComponent from '~/error.vue'
import type { NuxtError } from '#app'

function createMockError(statusCode: number, statusMessage: string): NuxtError {
  return {
    statusCode,
    statusText: statusMessage,
    status: statusCode,
    name: 'NuxtError',
    message: statusMessage,
    fatal: false,
    unhandled: false,
    toJSON: () => ({ message: statusMessage, statusCode })
  }
}

describe('error.vue', () => {
  it('show status code and error message', async () => {
    const mockError: NuxtError = createMockError(404, 'Page non trouvée')

    const wrapper = await mountSuspended(ErrorComponent, { props: { error: mockError } })

    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('Page non trouvée')
    expect(wrapper.text()).toContain('Retour à l’accueil')
  })

  it('show default message if statusText is absent', async () => {
    const mockError: NuxtError = createMockError(500, '')

    const wrapper = await mountSuspended(ErrorComponent, { props: { error: mockError } })

    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).toContain('La page demandée est temporairement indisponible.')
  })

  it('contains a link to the homepage', async () => {
    const mockError: NuxtError = createMockError(403, 'Accès interdit')

    const wrapper = await mountSuspended(ErrorComponent, { props: { error: mockError } })

    const link = wrapper.findComponent({ name: 'UButton' })
    expect(link.text()).toBe('Retour à l’accueil')
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toBe('/')
  })
})
