import { describe, expect, it } from 'vitest'
import TagSelection from '~/components/common/TagSelection.vue'
import { mountWithUApp } from '../../../utils/utils'

describe('TagSelection', () => {
  it('initializes the input menu with the selected tags and available options', async () => {
    const wrapper = await mountWithUApp(TagSelection, {
      tags: ['C++'],
      optionTags: ['C++', 'Java', 'Python']
    })
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    expect(input.exists()).toBe(true)
    expect(input.props('modelValue')).toEqual(['C++'])
    expect(input.props('items')).toEqual(['C++', 'Java', 'Python'])
    expect(input.props('loading')).toBe(false)
    expect(input.props('disabled')).toBe(false)
  })

  it('configures the input menu for multiple tag selection with autocomplete', async () => {
    const wrapper = await mountWithUApp(TagSelection, {
      tags: [],
      optionTags: ['C++', 'Java', 'Python']
    })
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    expect(input.props('multiple')).toBe(true)
  })

  it('disables the input menu while tag options are loading', async () => {
    const wrapper = await mountWithUApp(TagSelection, {
      tags: ['C++']
    })
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    expect(input.props('items')).toEqual([])
    expect(input.props('loading')).toBe(true)
    expect(input.props('disabled')).toBe(true)
  })

  it('emits updatedTags when the selected tags change', async () => {
    const wrapper = await mountWithUApp(TagSelection, {
      tags: ['C++'],
      optionTags: ['C++', 'Java', 'Python']
    })
    const input = wrapper.findComponent({ name: 'UInputMenu' })
    const updatedTags = ['C++', 'TypeScript']
    await input.vm.$emit('update:modelValue', updatedTags)

    const emittedTags = wrapper.findComponent(TagSelection).emitted('updatedTags')
    expect(emittedTags).toBeDefined()
    expect(emittedTags?.at(-1)).toEqual([updatedTags])
  })
})