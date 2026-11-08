import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useConnectedStudentStore } from '~/stores/connectedStudent'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  cookieValues: {} as Record<string, string | null>
}))

mockNuxtImport('$fetch', () => mocks.fetch)
mockNuxtImport('useCookie', () => (key: string) => ({
  get value() {
    return mocks.cookieValues[key] ?? null
  },
  set value(val: string | null) {
    mocks.cookieValues[key] = val
  }
}))

const mockPromotions: APIConnectedStudent[] = [
  {
    idInscription: 10,
    annee: '2025-2026',
    readOnly: true,
    formation: {
      nom: 'BUT2 Informatique',
      departement: 'Informatique'
    }
  },
  {
    idInscription: 20,
    annee: '2026-2027',
    readOnly: false,
    formation: {
      nom: 'BUT3 Informatique',
      departement: 'Informatique'
    }
  }
]

describe('connectedStudent Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.cookieValues = {}
  })

  describe('getters', () => {
    it('getSelectedPromotion returns selected promotion', () => {
      const store = useConnectedStudentStore()
      store.promotions = mockPromotions
      store.selectedPromotion = mockPromotions[1]!

      expect(store.getSelectedPromotion).toEqual(mockPromotions[1])
    })

    it('getSelectedPromotion fallback on cookie when available in promotions', () => {
      const store = useConnectedStudentStore()

      expect(store.getSelectedPromotion).toEqual(null)

      store.promotions = mockPromotions
      mocks.cookieValues['selectedPromotion'] = '20'

      expect(store.getSelectedPromotion).toEqual(mockPromotions[1])
    })

    it('getSelectedPromotion clears invalid cookie and fallback to first promotion', () => {
      const store = useConnectedStudentStore()
      store.promotions = mockPromotions
      mocks.cookieValues['selectedPromotion'] = '9999'

      expect(store.getSelectedPromotion).toEqual(mockPromotions[0])
      expect(mocks.cookieValues['selectedPromotion']).toBeNull()
    })

    it('getSelectedPromotion returns null when promotions list is empty', () => {
      const store = useConnectedStudentStore()
      store.promotions = []

      expect(store.getSelectedPromotion).toBeNull()
    })

    it('getPromotions returns all promotions in state', () => {
      const store = useConnectedStudentStore()
      store.promotions = mockPromotions

      expect(store.getPromotions).toEqual(mockPromotions)
    })

    it('isReadOnlyYear returns readOnly flag from selected promotion', () => {
      const store = useConnectedStudentStore()
      store.promotions = mockPromotions

      store.selectedPromotion = mockPromotions[0]!
      expect(store.isReadOnlyYear).toBe(true)

      store.selectedPromotion = mockPromotions[1]!
      expect(store.isReadOnlyYear).toBe(false)
    })

    it('isReadOnlyYear returns false if no promotion is selected', () => {
      const store = useConnectedStudentStore()
      expect(store.isReadOnlyYear).toBe(false)
    })
  })

  describe('actions', () => {
    it('setSelectedPromotion updates state and writes cookie', () => {
      const store = useConnectedStudentStore()

      expect(mocks.cookieValues['selectedPromotion']).toBe(undefined)
      store.setSelectedPromotion(mockPromotions[0]!)

      expect(store.selectedPromotion).toEqual(mockPromotions[0])
      expect(mocks.cookieValues['selectedPromotion']).toBe('10')
    })

    it('fetchPromotions fetches data and sets loaded to true', async () => {
      const store = useConnectedStudentStore()
      mocks.fetch.mockResolvedValueOnce(mockPromotions)

      await store.fetchPromotions()

      expect(mocks.fetch).toHaveBeenCalledWith('/api/me/student', { headers: undefined })
      expect(store.promotions).toEqual(mockPromotions)
      expect(store.loaded).toBe(true)
    })

    it('fetchPromotions does not call API if already loaded', async () => {
      const store = useConnectedStudentStore()
      store.loaded = true

      await store.fetchPromotions()

      expect(mocks.fetch).not.toHaveBeenCalled()
    })

    it('fetchPromotions logs error on failure', async () => {
      const store = useConnectedStudentStore()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.fetch.mockRejectedValueOnce(new Error('API Error'))

      await store.fetchPromotions()

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(store.loaded).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
