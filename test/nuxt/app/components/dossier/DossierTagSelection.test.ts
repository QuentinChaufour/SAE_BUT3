import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TagSelection from '~/components/common/TagSelection.vue'
import DossierTagSelection from '~/components/dossier/DossierTagSelection.vue'
import { mountWithUApp } from '../../../utils/utils'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn()
}))

mockNuxtImport('$fetch', () => mocks.fetch)

const departementTags = {
  statusCode: 200,
  data: [{ nomTag: 'Java' }, { nomTag: 'Python' }, { nomTag: 'TypeScript' }]
}

describe('DossierTagSelection', () => {
  beforeEach(() => {
    mocks.fetch.mockReset()
    mocks.fetch.mockResolvedValue(departementTags)
  })

  it('loads department tags and passes them to the tag selection', async () => {
    const wrapper = await mountWithUApp(DossierTagSelection, {
      tags: ['Java'],
      idDepartement: 7,
      idDossier: 42
    })

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/departement/7/tags', { method: 'GET' })
    })

    const tagSelection = wrapper.findComponent(TagSelection)
    expect(tagSelection.props('tags')).toEqual(['Java'])
    expect(tagSelection.props('optionTags')).toEqual(['Java', 'Python', 'TypeScript'])
  })

  it('handles a missing department when loading tags on mount', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await mountWithUApp(DossierTagSelection, {
      tags: [],
      idDepartement: null,
      idDossier: 42
    })

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'idDepartement is null or undefined' })
      )
    })

    expect(mocks.fetch).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('handles an invalid department tags response', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.fetch.mockResolvedValue({
      statusCode: 500,
      data: null
    })

    await mountWithUApp(DossierTagSelection, {
      tags: [],
      idDepartement: 7,
      idDossier: 42
    })

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to fetch departement tags' })
      )
    })

    consoleError.mockRestore()
  })

  it('adds newly selected tags to the dossier', async () => {
    const wrapper = await mountWithUApp(DossierTagSelection, {
      tags: ['Java'],
      idDepartement: 7,
      idDossier: 42
    })

    await wrapper.findComponent(TagSelection).vm.$emit('updatedTags', ['Java', 'Python'])

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/dossier/42/tags', {
        method: 'POST',
        body: { tag: 'Python' }
      })
    })
  })

  it('does not add a tag that is already selected', async () => {
    const wrapper = await mountWithUApp(DossierTagSelection, {
      tags: ['Java'],
      idDepartement: 7,
      idDossier: 42
    })

    await wrapper.findComponent(TagSelection).vm.$emit('updatedTags', ['Java'])

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/departement/7/tags', { method: 'GET' })
    })
    expect(mocks.fetch).not.toHaveBeenCalledWith('/api/dossier/42/tags', expect.anything())
  })

  it('deletes tags removed from the dossier', async () => {
    const wrapper = await mountWithUApp(DossierTagSelection, {
      tags: ['Java', 'Python'],
      idDepartement: 7,
      idDossier: 42
    })

    await wrapper.findComponent(TagSelection).vm.$emit('updatedTags', ['Java'])

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/dossier/42/tags', {
        method: 'DELETE',
        body: { tag: 'Python' }
      })
    })
  })

  it('replaces a selected tag with a new tag', async () => {
    const wrapper = await mountWithUApp(DossierTagSelection, {
      tags: ['Java'],
      idDepartement: 7,
      idDossier: 42
    })

    await wrapper.findComponent(TagSelection).vm.$emit('updatedTags', ['Python'])

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('/api/dossier/42/tags', {
        method: 'POST',
        body: { tag: 'Python' }
      })
    })
    expect(mocks.fetch).toHaveBeenCalledWith('/api/dossier/42/tags', {
      method: 'DELETE',
      body: { tag: 'Java' }
    })
  })
})