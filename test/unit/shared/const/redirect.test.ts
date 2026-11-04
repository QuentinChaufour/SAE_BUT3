import { describe, it, expect } from 'vitest'
import { getRoleRedirectPath } from '~~/shared/const/redirect'
import UserRole from '~~/shared/types/role'

describe('redirect', () => {
  describe('getRoleRedirectPath', () => {
    it('should return the correct redirect path for Student role', () => {
      const result = getRoleRedirectPath(UserRole.Student)
      expect(result).toBe('/student/search')
    })

    it('should return the correct redirect path for Secretary role', () => {
      const result = getRoleRedirectPath(UserRole.Secretary)
      expect(result).toBe('')
    })

    it('should return the correct redirect path for Teacher role', () => {
      const result = getRoleRedirectPath(UserRole.Teacher)
      expect(result).toBe('')
    })

    it('should return the correct redirect path for Admin role', () => {
      const result = getRoleRedirectPath(UserRole.Admin)
      expect(result).toBe('/departments')
    })
  })
})
