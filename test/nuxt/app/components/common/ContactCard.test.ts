import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ContactCard from '~/components/common/ContactCard.vue'
import type { DemarcheContact } from '~~/generated/prisma/client'

const contact: DemarcheContact = {
  idContact: 1,
  nom: 'Dupont',
  prenom: 'Jean',
  fonction: 'Responsable RH',
  email: null,
  telephone: null,
  idRecherche: null
}

describe('ContactCard', () => {
  it('displays the contact initials, name, and function', () => {
    const wrapper = mount(ContactCard, { props: { contact } })
    const paragraphs = wrapper.findAll('p')

    expect(wrapper.text()).toContain('JD')
    expect(paragraphs[0]!.text()).toBe('Jean Dupont')
    expect(paragraphs[1]!.text()).toBe('Responsable RH')
  })

  it('uses the fallback title when the contact has no first name', () => {
    const wrapper = mount(ContactCard, {
      props: {
        contact: {
          ...contact,
          prenom: null
        }
      }
    })
    const paragraphs = wrapper.findAll('p')

    expect(wrapper.text()).toContain('D')
    expect(paragraphs[0]!.text()).toBe('Mr./Mme. Dupont')
  })

  it('renders an empty function when it is not provided', () => {
    const wrapper = mount(ContactCard, {
      props: {
        contact: {
          ...contact,
          fonction: null
        }
      }
    })
    const paragraphs = wrapper.findAll('p')

    expect(paragraphs[1]!.text()).toBe('')
  })
})
