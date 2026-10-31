import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchCompanySiretForm from '~/components/companies/forms/SearchCompanySiretForm.vue'
import { mountWithUApp, resetNuxtMocks } from '../../../../utils/utils'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), toast: { add: vi.fn() } }))
mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useToast', () => () => mocks.toast)

const mockApiResponse = {
  results: [
    {
      nom_complet: 'TEST CORP',
      siege: {
        code_postal: '75001',
        libelle_commune: 'Paris',
        libelle_voie: 'de la Paix',
        type_voie: 'Rue',
        numero_voie: '10',
        siret: '12345678901234',
        libelle_pays_etranger: 'France'
      },
      matching_etablissements: [
        { liste_enseignes: ['Boutique TEST'] }
      ]
    }
  ]
}

describe('SearchCompanySiretForm.vue', () => {
  beforeEach(() => {
    resetNuxtMocks(mocks)
  })

  it('check content', async () => {
    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const formField = form.findComponent({ name: 'UFormField' })
    expect(formField.exists()).toBe(true)
    expect(formField.props('label')).toBe('Préremplir avec le SIRET')
    expect(formField.text()).toContain('Vous pouvez récupérer le numéro de SIRET d\'une entreprise française')

    const input = form.find('input')
    expect(input.attributes('placeholder')).toBe('123 456 789 01234')

    const button = formField.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('icon')).toBe('i-lucide-search')
  })

  it('check button disabled with no siret', async () => {
    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('')

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(true)
  })

  it('check button enabled with a valid siret', async () => {
    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('')

    input.setValue('19450855200065')
    await nextTick()

    expect(input.element.value).toBe('19450855200065')

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)
  })

  it('make a search with a valid SIRET', async () => {
    mocks.fetch.mockResolvedValueOnce(mockApiResponse)

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('123 456 789 01234')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)

    await button.trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('https://recherche-entreprises.api.gouv.fr/search', {
        query: { q: '12345678901234', per_page: 1 }
      })
    })

    expect(form.emitted('found')).toBeTruthy()
    expect(form.emitted('found')?.[0]).toEqual([
      {
        nom: 'TEST CORP',
        nomEtab: 'Boutique TEST',
        adresse: '10 Rue de la Paix',
        ville: 'Paris',
        codePostal: '75001',
        siret: '12345678901234',
        pays: 'France'
      }
    ])
  })

  it('make a search with a valid SIRET - foreign country', async () => {
    mocks.fetch.mockResolvedValueOnce({ results: [{ ...mockApiResponse.results[0], siege: { ...mockApiResponse.results[0]!.siege, libelle_pays_etranger: 'Suisse', libelle_commune: 'Berne', code_postal: '' } }] })

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('123 456 789 01234')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)

    await button.trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('https://recherche-entreprises.api.gouv.fr/search', {
        query: { q: '12345678901234', per_page: 1 }
      })
    })

    expect(form.emitted('found')).toBeTruthy()
    expect(form.emitted('found')?.[0]).toEqual([
      {
        nom: 'TEST CORP',
        nomEtab: 'Boutique TEST',
        adresse: '10 Rue de la Paix',
        ville: 'Berne',
        codePostal: '',
        siret: '12345678901234',
        pays: 'Suisse'
      }
    ])
  })

  it('make a search with a valid SIRET - no foreign country', async () => {
    mocks.fetch.mockResolvedValueOnce({ results: [{ ...mockApiResponse.results[0], siege: { ...mockApiResponse.results[0]!.siege, libelle_pays_etranger: '', libelle_commune: 'Berne', code_postal: '' } }] })

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('123 456 789 01234')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)

    await button.trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('https://recherche-entreprises.api.gouv.fr/search', {
        query: { q: '12345678901234', per_page: 1 }
      })
    })

    expect(form.emitted('found')).toBeTruthy()
    expect(form.emitted('found')?.[0]).toEqual([
      {
        nom: 'TEST CORP',
        nomEtab: 'Boutique TEST',
        adresse: '10 Rue de la Paix',
        ville: 'Berne',
        codePostal: '',
        siret: '12345678901234',
        pays: 'France'
      }
    ])
  })

  it('make a search with a valid SIRET - no nom etab', async () => {
    mocks.fetch.mockResolvedValueOnce({ results: [{ ...mockApiResponse.results[0], matching_etablissements: [] }] })

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('123 456 789 01234')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)

    await button.trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('https://recherche-entreprises.api.gouv.fr/search', {
        query: { q: '12345678901234', per_page: 1 }
      })
    })

    expect(form.emitted('found')).toBeTruthy()
    expect(form.emitted('found')?.[0]).toEqual([
      {
        nom: 'TEST CORP',
        nomEtab: '',
        adresse: '10 Rue de la Paix',
        ville: 'Paris',
        codePostal: '75001',
        siret: '12345678901234',
        pays: 'France'
      }
    ])
  })

  it('make a search with a valid SIRET but no results', async () => {
    mocks.fetch.mockResolvedValueOnce({ results: [] })

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('123 456 789 01234')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)

    await button.trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('https://recherche-entreprises.api.gouv.fr/search', {
        query: { q: '12345678901234', per_page: 1 }
      })
    })

    expect(form.emitted('found')).toBeFalsy()
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Erreur',
      description: 'Aucune entreprise trouvée avec le SIRET "12345678901234"'
    })
  })

  it('make a search with a valid SIRET but no releasable data', async () => {
    mocks.fetch.mockResolvedValueOnce({ results: [{ ...mockApiResponse.results[0], nom_complet: '[NON-DIFFUSIBLE]' }] })

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('123 456 789 01234')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
    expect(button.props('disabled')).toBe(false)

    await button.trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith('https://recherche-entreprises.api.gouv.fr/search', {
        query: { q: '12345678901234', per_page: 1 }
      })
    })

    expect(form.emitted('found')).toBeFalsy()
    expect(mocks.toast.add).toHaveBeenCalledWith({
      color: 'error',
      title: 'Erreur',
      description: 'Les données de l\'entreprise pour le SIRET "12345678901234" sont non diffusibles.'
    })
  })

  it('show error when SIRET is invalid', async () => {
    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    await form.find('input').setValue('1234567890123A')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })

    expect(button.props('disabled')).toBe(true)
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('show error when API search fails', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Erreur réseau'))

    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    await form.find('input').setValue('12345678901234')
    await nextTick()

    await form.findComponent({ name: 'UButton' }).trigger('click')

    await vi.waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalled()
    })

    expect(mocks.toast.add).toHaveBeenCalledWith({
      title: 'Erreur',
      description: 'Une erreur s\'est produite lors de la recherche du SIRET "12345678901234".',
      color: 'error'
    })
  })

  it('show error when SIRET is invalid', async () => {
    const wrapper = await mountWithUApp(SearchCompanySiretForm)
    const form = wrapper.findComponent(SearchCompanySiretForm)

    const input = form.find('input')
    await input.setValue('1234567890123A')
    await nextTick()

    const button = form.findComponent({ name: 'UButton' })

    expect(button.props('disabled')).toBe(true)

    // Forcer le clic même si le bouton est désactivé
    await button.vm.$emit('click')

    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.toast.add).toHaveBeenCalledWith({
      title: 'Erreur',
      description: 'Le SIRET doit contenir 14 chiffres.',
      color: 'error'
    })
  })
})
