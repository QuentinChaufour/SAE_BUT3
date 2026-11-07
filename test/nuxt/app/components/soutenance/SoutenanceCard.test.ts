import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import SoutenanceCard from '~/components/soutenance/SoutenanceCard.vue'

describe('SoutenanceCard.vue', () => {
    function mountSoutenanceCard(props: {
        class_name: string
        alternance: boolean
        stages: number
        soutenances: number
    }) {
        return mount(SoutenanceCard, {
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

    it('displays the class details for a standard class', () => {
        const wrapper = mountSoutenanceCard({
            class_name: 'BUT Informatique',
            alternance: false,
            stages: 24,
            soutenances: 12
        })

        expect(wrapper.text()).toContain('BUT Informatique')
        expect(wrapper.text()).toContain('24 stagiaires')
        expect(wrapper.text()).toContain('12 soutenances planifiées')
        expect(wrapper.text()).not.toContain('alternance')
    })

    it('displays alternants and the alternance label', () => {
        const wrapper = mountSoutenanceCard({
            class_name: 'BUT Réseaux',
            alternance: true,
            stages: 20,
            soutenances: 5
        })

        expect(wrapper.text()).toContain('BUT Réseaux alternance')
        expect(wrapper.text()).toContain('20 alternants')
        expect(wrapper.text()).not.toContain('20 stagiaires')
    })

    it('sets and updates the progress', async () => {
        const wrapper = mountSoutenanceCard({
            class_name: 'BUT Informatique',
            alternance: false,
            stages: 24,
            soutenances: 6
        })
        const progress = wrapper.findComponent({ name: 'UProgress' })

        expect(progress.props('modelValue')).toBe(0.25)
        expect(progress.props('max')).toBe(1)

        progress.vm.$emit('update:modelValue', 0.5)
        await nextTick()

        expect(progress.props('modelValue')).toBe(0.5)
    })
})
