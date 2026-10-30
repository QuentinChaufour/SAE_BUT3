import { describe, expect, it, vi } from 'vitest'
import { getCurrentAcademicYear } from '~~/server/utils/year'

describe('year', () => {
  describe('getCurrentAcademicYear', () => {
    it('return date before june', () => {
      vi.setSystemTime(new Date('2026-05-31'))
      expect(getCurrentAcademicYear()).toBe('2025-2026')
    })

    it('return date in september', () => {
      vi.setSystemTime(new Date('2026-09-30'))
      expect(getCurrentAcademicYear()).toBe('2026-2027')
    })
  })
})
