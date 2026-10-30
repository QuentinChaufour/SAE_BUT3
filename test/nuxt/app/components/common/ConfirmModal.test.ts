import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ConfirmModal from '~/components/common/ConfirmModal.vue'

function mountModal(title: string = 'Titre', description: string = 'Description') {
  return mountSuspended(ConfirmModal, {
    props: { title, description, open: true },
    attrs: { open: true, portal: false }
  })
}

describe('ConfirmModal.vue', () => {
  it('check title and description', async () => {
    const wrapper = await mountModal(
      'Confirmer l\'action',
      'Êtes-vous sûr de vouloir continuer ?'
    )

    expect(wrapper.text()).toContain('Confirmer l\'action')
    expect(wrapper.text()).toContain('Êtes-vous sûr de vouloir continuer ?')
  })

  it('emit cancel event when cancel button is clicked', async () => {
    const wrapper = await mountModal()

    const cancelButton = wrapper.findAll('button').find(b => b.text().includes('Annuler'))

    expect(cancelButton).toBeDefined()
    await cancelButton?.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emit confirm event when confirm button is clicked', async () => {
    const wrapper = await mountModal()

    const confirmButton = wrapper.findAll('button').find(b => b.text().includes('Confirmer'))

    expect(confirmButton).toBeDefined()
    await confirmButton?.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})
