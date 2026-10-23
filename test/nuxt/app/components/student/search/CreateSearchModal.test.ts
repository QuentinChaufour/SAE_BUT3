import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CreateSearchModal from '~/components/student/search/CreateSearchModal.vue'
import { UApp, UButton, UFormField } from '#components'

const CreateSearchModalComponent = defineComponent({
  setup() {
    return () => h(UApp, null, { default: () => h(CreateSearchModal) })
  }
})

describe('CreateSearchModal', () => {
  it('check content', async () => {
    const wrapper = await mountSuspended(CreateSearchModalComponent)

    const button = wrapper.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Ajouter')

    const modal = wrapper.findComponent({ name: 'UModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(false)

    await button.trigger('click')
    await vi.waitFor(() => {
      expect(modal.props('open')).toBe(true)
      expect(wrapper.findAllComponents(UFormField).length).toBeGreaterThan(0)
    })

    const forms = wrapper.findAllComponents(UFormField)
    const nomLabels = ['Entreprise', 'Titre', 'Description', 'Alternance']

    expect(forms.length).toBe(nomLabels.length)
    for (let i = 0; i < forms.length; i++) {
      expect(forms[i]!.props('label')).toBe(nomLabels[i])
    }

    const createButton = modal.findAllComponents(UButton).find(button => button.text() === 'Créer')
    expect(createButton).toBeDefined()
  })
})
