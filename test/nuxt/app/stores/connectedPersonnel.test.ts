import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useConnectedPersonnelStore } from '~/stores/connectedPersonnel'

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

const mockDepartments: APIConnectedPersonnel[] = [
  {
    departement: { id: 1, nom: 'Informatique' },
    annees: ['2024-2025', '2025-2026', '2026-2027']
  },
  {
    departement: { id: 2, nom: 'Chimie' },
    annees: ['2025-2026', '2026-2027']
  }
]

describe('connectedPersonnel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.cookieValues = {}
  })

  describe('getters', () => {
    it('getSelectedDepartment returns selected department', () => {
      const store = useConnectedPersonnelStore()
      store.departments = mockDepartments
      store.selectedDepartment = mockDepartments[1]!

      expect(store.getSelectedDepartment).toEqual(mockDepartments[1])
    })

    it('getSelectedDepartment fallback on cookie', () => {
      const store = useConnectedPersonnelStore()

      expect(store.getSelectedDepartment).toEqual(null)

      store.departments = mockDepartments
      mocks.cookieValues['selectedDepartment'] = '2'

      expect(store.getSelectedDepartment).toEqual(mockDepartments[1])
    })

    it('getSelectedDepartment clears invalid cookie and fallback to first department', () => {
      const store = useConnectedPersonnelStore()
      store.departments = mockDepartments
      mocks.cookieValues['selectedDepartment'] = '999'

      expect(store.getSelectedDepartment).toEqual(mockDepartments[0])
      expect(mocks.cookieValues['selectedDepartment']).toBeNull()
    })

    it('getSelectedDepartment returns null when departments list is empty', () => {
      const store = useConnectedPersonnelStore()
      store.departments = []

      expect(store.getSelectedDepartment).toBeNull()
    })

    it('getDepartments returns all departments in state', () => {
      const store = useConnectedPersonnelStore()
      store.departments = mockDepartments

      expect(store.getDepartments).toEqual(mockDepartments)
    })

    it('getCurrentYear fallback to last year of selected department', () => {
      const store = useConnectedPersonnelStore()
      store.departments = mockDepartments

      expect(store.getCurrentYear).toBe('2026-2027')
    })

    it('getCurrentYear returns undefined when no department selected', () => {
      const store = useConnectedPersonnelStore()
      expect(store.getCurrentYear).toBeUndefined()
    })

    it('getCurrentYear return undefined if cookie is invalid for selected department', () => {
      const store = useConnectedPersonnelStore()
      mocks.cookieValues['currentYear'] = '1999-2000'

      expect(store.getCurrentYear).toBeUndefined()
      expect(mocks.cookieValues['currentYear']).toBeNull()
    })

    it('getCurrentYear returns cookie value if valid for selected department', () => {
      const store = useConnectedPersonnelStore()
      store.selectedDepartment = mockDepartments[0]!
      mocks.cookieValues['currentYear'] = '2025-2026'

      expect(store.getCurrentYear).toBe('2025-2026')
      expect(mocks.cookieValues['currentYear']).toBe('2025-2026')
    })

    it('isReadOnlyYear returns true when current year is an old year', () => {
      const store = useConnectedPersonnelStore()
      store.departments = mockDepartments
      store.selectedDepartment = mockDepartments[0]!
      store.currentYear = '2023-2024'

      expect(store.isReadOnlyYear).toBe(true)
    })

    it('isReadOnlyYear returns false if no department or no current year', () => {
      const store = useConnectedPersonnelStore()
      expect(store.isReadOnlyYear).toBe(false)
    })
  })

  describe('actions', () => {
    it('setSelectedDepartment sets department, updates currentYear to latest and writes cookie', () => {
      const store = useConnectedPersonnelStore()
      store.setSelectedDepartment(mockDepartments[0]!)

      expect(store.selectedDepartment).toEqual(mockDepartments[0])
      expect(store.currentYear).toBe('2026-2027')
      expect(mocks.cookieValues['selectedDepartment']).toBe('1')
    })

    it('setSelectedDepartment sets currentYear to null if department has no years', () => {
      const store = useConnectedPersonnelStore()
      const gmpDept: APIConnectedPersonnel = {
        departement: { id: 3, nom: 'GMP' },
        annees: []
      }

      store.setSelectedDepartment(gmpDept)

      expect(store.selectedDepartment).toEqual(gmpDept)
      expect(store.currentYear).toBeNull()
      expect(mocks.cookieValues['selectedDepartment']).toBe('3')
    })

    it('setCurrentYear updates currentYear and cookie if year exists in selected department', () => {
      const store = useConnectedPersonnelStore()
      store.selectedDepartment = mockDepartments[0]!

      store.setCurrentYear('2024-2025')

      expect(store.currentYear).toBe('2024-2025')
      expect(mocks.cookieValues['currentYear']).toBe('2024-2025')
    })

    it('setCurrentYear does nothing if year does not belong to selected department', () => {
      const store = useConnectedPersonnelStore()
      store.selectedDepartment = mockDepartments[0]!
      store.currentYear = '2025-2026'

      store.setCurrentYear('1999-2000')

      expect(store.currentYear).toBe('2025-2026')
      expect(mocks.cookieValues['currentYear']).toBeUndefined()
    })

    it('fetchPromotions fetches data and sets loaded to true', async () => {
      const store = useConnectedPersonnelStore()
      mocks.fetch.mockResolvedValueOnce(mockDepartments)

      await store.fetchPromotions()

      expect(mocks.fetch).toHaveBeenCalledWith('/api/me/personnel', { headers: undefined })
      expect(store.departments).toEqual(mockDepartments)
      expect(store.loaded).toBe(true)
    })

    it('fetchPromotions does not call API if already loaded', async () => {
      const store = useConnectedPersonnelStore()
      store.loaded = true

      await store.fetchPromotions()

      expect(mocks.fetch).not.toHaveBeenCalled()
    })

    it('fetchPromotions logs error on failure', async () => {
      const store = useConnectedPersonnelStore()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mocks.fetch.mockRejectedValueOnce(new Error('API Error'))

      await store.fetchPromotions()

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(store.loaded).toBe(false)

      consoleSpy.mockRestore()
    })
  })
})
