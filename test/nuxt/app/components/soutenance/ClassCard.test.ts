import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ClassCard from '~/components/soutenance/ClassCard.vue'

describe('ClassCard.vue', () => {
    function mountClassCard(props: {
        class_name: string
        alternance: boolean
        nb_etudiants: number
        nb_stages: number
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
            class_name: 'BUT Informatique',
            alternance: true,
            nb_etudiants: 24,
            nb_stages: 12
        })

        expect(wrapper.text()).toContain('BUT Informatique alternance')
        expect(wrapper.text()).toContain('24 étudiants')
        expect(wrapper.text()).toContain('12 alternances')
    })

    it('displays stages for a non-alternance class', () => {
        const wrapper = mountClassCard({
            class_name: 'BUT Réseaux',
            alternance: false,
            nb_etudiants: 30,
            nb_stages: 15
        })

        expect(wrapper.text()).toContain('BUT Réseaux')
        expect(wrapper.text()).not.toContain('BUT Réseaux alternance')
        expect(wrapper.text()).toContain('30 étudiants')
        expect(wrapper.text()).toContain('15 stages')
    })

    it('sets the progress to the proportion of stages', () => {
        const wrapper = mountClassCard({
            class_name: 'BUT Informatique',
            alternance: false,
            nb_etudiants: 24,
            nb_stages: 6
        })
        const progress = wrapper.findComponent({ name: 'UProgress' })

        expect(progress.props('modelValue')).toBe(0.25)
        expect(progress.props('max')).toBe(1)
    })

    it('updates the progress when the progressbar v-model changes', async () => {
        const wrapper = mountClassCard({
            class_name: 'BUT Informatique',
            alternance: false,
            nb_etudiants: 24,
            nb_stages: 6
        })
        const progress = wrapper.findComponent({ name: 'UProgress' })

        progress.vm.$emit('update:modelValue', 0.5)
        await nextTick()

        expect(progress.props('modelValue')).toBe(0.5)
    })
})
