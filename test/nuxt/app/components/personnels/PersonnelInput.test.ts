import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountWithUApp, resetNuxtMocks, type Wrapper } from '../../../utils/utils'
import PersonnelInput from '~/components/personnels/PersonnelInput.vue'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  toast: { add: vi.fn() }
}))
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const apiPersonnels = [
  { numPersonnel: 'p1234567', nom: 'Dupont', prenom: 'Jean' },
  { numPersonnel: 'p87654321', nom: 'Martin', prenom: 'Claire' }
]

const personnelsItems = [
  {
    numPersonnel: 'p1234567',
    nom: 'Dupont',
    prenom: 'Jean',
    existing: true
  },
  {
    numPersonnel: 'p87654321',
    nom: 'Martin',
    prenom: 'Claire',
    existing: true
  }
]

describe('PersonnelInput', () => {
  let wrapper: Wrapper
  beforeEach(() => {
    wrapper?.unmount()
    resetNuxtMocks(mocks)
  })

  it('check content', async () => {
    wrapper = await mountWithUApp(PersonnelInput)
    const personnel = wrapper.findComponent(PersonnelInput)
    expect(personnel.exists()).toBe(true)

    const input = wrapper.findComponent({ name: 'UInputMenu' })
    expect(input.exists()).toBe(true)

    expect(input.html()).toContain('Saisir le numéro du personnel')
  })

  it('check initial state', async () => {
    wrapper = await mountWithUApp(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    expect(input.props('items')).toEqual([])
    expect(input.props('loading')).toBe(false)
    expect(input.props('createItem')).toBe('always')
    expect(input.props('ignoreFilter')).toBe(true)
    expect(input.props('clear')).toBeTruthy()
    expect(input.props('open')).toBe(false)
    expect(input.props('searchTerm')).toBe('')
  })

  it('check fetch', async () => {
    mocks.fetch.mockResolvedValueOnce(apiPersonnels)

    wrapper = await mountWithUApp(PersonnelInput, { role: 'admin' })
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'p888')
    await nextTick()

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels', expect.objectContaining({
        query: expect.objectContaining({ search: 'p888', role: 'admin' })
      }))
    })
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('check input items after search', async () => {
    mocks.fetch.mockResolvedValueOnce(apiPersonnels)

    wrapper = await mountWithUApp(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'p')
    await nextTick()

    await vi.waitFor(() => {
      expect(input.props('items')).toEqual(personnelsItems)
    })
  })

  it('do not fetch if search is empty', async () => {
    wrapper = await mountWithUApp(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', '   ')
    await nextTick()

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(input.props('items')).toEqual([])
  })

  it('clears the results when the search term is emptied', async () => {
    mocks.fetch.mockResolvedValueOnce(apiPersonnels)

    wrapper = await mountWithUApp(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })
    await input.get('button[aria-label="Show options"]').trigger('click')
    await nextTick()

    input.vm.$emit('update:searchTerm', 'p')
    await nextTick()
    await vi.waitFor(() => expect(input.props('items')).toHaveLength(2))

    input.vm.$emit('update:searchTerm', '')
    await nextTick()

    await vi.waitFor(() => {
      expect(input.props('items')).toEqual([])
    })
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('clears the results when the search term contains only whitespace', async () => {
    mocks.fetch.mockResolvedValueOnce(apiPersonnels)

    wrapper = await mountWithUApp(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:searchTerm', 'p')
    await vi.waitFor(() => expect(input.props('items')).toHaveLength(2))

    input.vm.$emit('update:searchTerm', '  ')
    await vi.waitFor(() => expect(input.props('items')).toEqual([]))
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
  })

  it('shows the create option when no personnel matches', async () => {
    mocks.fetch.mockResolvedValueOnce([])

    wrapper = await mountWithUApp(PersonnelInput)

    const menu = wrapper.findComponent({ name: 'UInputMenu' })
    await menu.get('button[aria-label="Show options"]').trigger('click')
    await nextTick()

    menu.vm.$emit('update:searchTerm', 'xyz')
    await nextTick()

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/personnels', expect.objectContaining({
        query: expect.objectContaining({ search: 'xyz' })
      }))
      expect(menu.props('items')).toHaveLength(0)
    })

    expect(document.body.textContent).toContain('Utiliser le numéro "xyz" (nouveau personnel)')
  })

  it('check items result', async () => {
    mocks.fetch.mockResolvedValueOnce(apiPersonnels)

    wrapper = await mountWithUApp(PersonnelInput)

    const menu = wrapper.findComponent({ name: 'UInputMenu' })
    await menu.get('button[aria-label="Show options"]').trigger('click')
    await nextTick()

    menu.vm.$emit('update:searchTerm', 'p')
    await nextTick()
    await vi.waitFor(() => expect(menu.props('items')).toHaveLength(2))

    expect(document.body.textContent).toContain('p1234567')
    expect(document.body.textContent).toContain('Jean Dupont')

    expect(document.body.textContent).toContain('p87654321')
    expect(document.body.textContent).toContain('Claire Martin')
  })

  it('updates the model and emits select when a personnel is selected', async () => {
    wrapper = await mountWithUApp(PersonnelInput)
    const personnel = wrapper.findComponent(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:modelValue', personnelsItems[0])
    await nextTick()

    expect(personnel.emitted('update:modelValue')?.at(-1)).toEqual(['p1234567'])
    expect(personnel.emitted('select')?.at(-1)).toEqual([
      { numPersonnel: 'p1234567', nom: 'Dupont', prenom: 'Jean', existing: true }
    ])
  })

  it('clears selection when model is set to null', async () => {
    wrapper = await mountWithUApp(PersonnelInput)
    const personnel = wrapper.findComponent(PersonnelInput)
    const input = wrapper.findComponent({ name: 'UInputMenu' })

    input.vm.$emit('update:modelValue', personnelsItems[0])
    await nextTick()

    expect(personnel.emitted('update:modelValue')?.at(-1)).toEqual(['p1234567'])
    expect(input.props('items')).toEqual([personnelsItems[0]])

    input.vm.$emit('update:modelValue', null)
    await nextTick()

    expect(personnel.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(personnel.emitted('select')?.at(-1)).toEqual([null])
  })

  describe('creation select', () => {
    it('select personnal number as a non-existing personnel', async () => {
      wrapper = await mountWithUApp(PersonnelInput)
      const personnel = wrapper.findComponent(PersonnelInput)
      const input = wrapper.findComponent({ name: 'UInputMenu' })

      input.vm.$emit('create', 'p9999')
      await nextTick()

      expect(personnel.emitted('update:modelValue')?.at(-1)).toEqual(['p9999'])
      expect(personnel.emitted('select')?.at(-1)).toEqual([{ numPersonnel: 'p9999', nom: '', prenom: '', existing: false }])
      expect(input.props('modelValue')).toEqual({
        numPersonnel: 'p9999',
        nom: '',
        prenom: '',
        existing: false
      })
    })

    it('closes the menu when creating', async () => {
      wrapper = await mountWithUApp(PersonnelInput)
      const input = wrapper.findComponent({ name: 'UInputMenu' })

      input.vm.$emit('update:open', true)
      await nextTick()
      expect(input.props('open')).toBe(true)

      input.vm.$emit('create', 'p9999')
      await nextTick()

      expect(input.props('open')).toBe(false)
    })

    it('does not create when search string is empty or whitespace', async () => {
      wrapper = await mountWithUApp(PersonnelInput)
      const personnel = wrapper.findComponent(PersonnelInput)
      const input = wrapper.findComponent({ name: 'UInputMenu' })

      input.vm.$emit('create', '   ')
      await nextTick()

      expect(personnel.emitted('update:modelValue')).toBeUndefined()
      expect(personnel.emitted('select')).toBeUndefined()
    })
  })
})
