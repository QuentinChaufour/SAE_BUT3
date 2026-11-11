import { describe, it, expect } from 'vitest'
import { getCityDisplayName } from '~/utils/cities'

describe('cities', () => {
  describe('getCityDisplayName', () => {
    it('should return the correct display name for a city with a postal code in France ', () => {
      const result = getCityDisplayName('Paris', '75000', 'France')
      expect(result).toBe('75000 Paris')
    })

    it('should return the correct display name for a city with a postal code in another country', () => {
      const result = getCityDisplayName('Berlin', '10115', 'Allemagne')
      expect(result).toBe('10115 Berlin, Allemagne')
    })

    it('should return if no postal code and another country than France', () => {
      const result = getCityDisplayName('Berlin', null, 'Allemagne')
      expect(result).toBe('Berlin, Allemagne')
    })
  })
})
