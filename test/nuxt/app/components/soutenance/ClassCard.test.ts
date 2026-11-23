import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ClassCard from '~/components/soutenance/ClassCard.vue'

describe('ClassCard.vue', () => {
  function mountClassCard(props: {
    className: string
    alternance: boolean
    nbEtudiants: number
    nbStages: number
  }) {
    return mount(ClassCard, {
      props,
      global: {
        stubs: {
          UCard: {
            template: '<div><slot /></div>'
          },
          UProgress: {
            name: 'UProgress',
            props: ['modelValue', 'max'],
            template: '<progress :value="modelValue" :max="max" />'
          }
        }
      }
    })
  }

  it('displays the class details and alternance labels', () => {
    const wrapper = mountClassCard({
      className: 'BUT Informatique',
      alternance: true,
      nbEtudiants: 24,
      nbStages: 12
    })

    expect(wrapper.text()).toContain('BUT Informatique alternance')
    expect(wrapper.text()).toContain('24 étudiants')
    expect(wrapper.text()).toContain('12 alternances')
  })

  it('displays stages for a non-alternance class', () => {
    const wrapper = mountClassCard({
      className: 'BUT Réseaux',
      alternance: false,
      nbEtudiants: 30,
      nbStages: 15
    })

    expect(wrapper.text()).toContain('BUT Réseaux')
    expect(wrapper.text()).not.toContain('BUT Réseaux alternance')
    expect(wrapper.text()).toContain('30 étudiants')
    expect(wrapper.text()).toContain('15 stages')
  })

  it('sets the progress to the proportion of stages', () => {
    const wrapper = mountClassCard({
      className: 'BUT Informatique',
      alternance: false,
      nbEtudiants: 24,
      nbStages: 6
    })
    const progress = wrapper.findComponent({ name: 'UProgress' })

    expect(progress.props('modelValue')).toBe(0.25)
    expect(progress.props('max')).toBe(1)
  })

  it('updates the progress when the progressbar v-model changes', async () => {
    const wrapper = mountClassCard({
      className: 'BUT Informatique',
      alternance: false,
      nbEtudiants: 24,
      nbStages: 6
    })
    const progress = wrapper.findComponent({ name: 'UProgress' })

    progress.vm.$emit('update:modelValue', 0.5)
    await nextTick()

    expect(progress.props('modelValue')).toBe(0.5)
  })
})
