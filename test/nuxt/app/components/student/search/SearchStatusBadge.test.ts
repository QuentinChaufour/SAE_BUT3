import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SearchStatusBadge from '~/components/student/search/SearchStatusBadge.vue'
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'

describe('SearchStatusBadge', () => {
  it('show accepted badge', async () => {
    const wrapper = await mountSuspended(SearchStatusBadge, {
      props: {
        status: Recherche_Stage_Status.Accepte
      }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.exists()).toBe(true)
    expect(badge.props('color')).toBe('success')
    expect(wrapper.text()).toContain('Accepté')
  })

  it('show abandoned badge', async () => {
    const wrapper = await mountSuspended(SearchStatusBadge, {
      props: {
        status: Recherche_Stage_Status.Abandon
      }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('error')
    expect(wrapper.text()).toContain('Abandonné')
  })

  it('show pending submission badge', async () => {
    const wrapper = await mountSuspended(SearchStatusBadge, {
      props: {
        status: Recherche_Stage_Status.AttenteEnvoi
      }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('neutral')
    expect(wrapper.text()).toContain('En attente d\'envoi')
  })

  it('show rejected badge', async () => {
    const wrapper = await mountSuspended(SearchStatusBadge, {
      props: {
        status: Recherche_Stage_Status.Refuse
      }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('warning')
    expect(wrapper.text()).toContain('Refusé')
  })

  it('show pending response badge', async () => {
    const wrapper = await mountSuspended(SearchStatusBadge, {
      props: {
        status: Recherche_Stage_Status.AttenteReponse
      }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('warning')
    expect(wrapper.text()).toContain('En attente de réponse')
  })

  it('show interview badge', async () => {
    const wrapper = await mountSuspended(SearchStatusBadge, {
      props: {
        status: Recherche_Stage_Status.Entretien
      }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('info')
    expect(wrapper.text()).toContain('Entretien')
  })
})
