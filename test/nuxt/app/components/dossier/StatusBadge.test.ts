import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StatusBadge from '~/components/dossier/StatusBadge.vue'
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'

describe('StatusBadge', () => {
  it('displays the status with the default size', async () => {
    const wrapper = await mountSuspended(StatusBadge, {
      props: { status: Recherche_Stage_Status.Accepte }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('success')
    expect(badge.props('size')).toBe('md')
    expect(wrapper.text()).toContain('Accepté')
  })

  it('forwards a custom size', async () => {
    const wrapper = await mountSuspended(StatusBadge, {
      props: { status: Recherche_Stage_Status.Entretien, size: 'sm' }
    })

    const badge = wrapper.findComponent({ name: 'UBadge' })
    expect(badge.props('color')).toBe('info')
    expect(badge.props('size')).toBe('sm')
    expect(wrapper.text()).toContain('Entretien')
  })
})
