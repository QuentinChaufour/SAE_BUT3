import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import UserRole from '~~/shared/types/role'
import { checkAuth, checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'

const mockRequireUserSession = vi.fn()

const event = { path: '/api/test' } as unknown as H3Event

function sessionWithRole(role: UserRole, id: string = '123456') {
  return { user: { numId: id, role } }
}

describe('middleware', () => {
  beforeEach(() => {
    vi.stubGlobal('requireUserSession', mockRequireUserSession)
  })

  describe('checkAuth', async () => {
    it('return session if allowed roles is not defined', async () => {
      const session = sessionWithRole(UserRole.Student)
      mockRequireUserSession.mockResolvedValue(session)

      await expect(checkAuth(event)).resolves.toBe(session)
    })

    it('return session if user role is allowed', async () => {
      const session = sessionWithRole(UserRole.Teacher)
      mockRequireUserSession.mockResolvedValue(session)

      await expect(checkAuth(event, [UserRole.Admin, UserRole.Teacher])).resolves.toBe(session)
    })

    it('return 403 error if role is not allowed', async () => {
      mockRequireUserSession.mockResolvedValue(sessionWithRole(UserRole.Student))
      await expect(checkAuth(event, [UserRole.Admin])).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Forbidden'
      })
    })

    it('return 403 error if allowedRoles is an empty array', async () => {
      mockRequireUserSession.mockResolvedValue(sessionWithRole(UserRole.Admin))
      await expect(checkAuth(event, [])).rejects.toMatchObject({ statusCode: 403 })
    })

    it('return 401 error if user is not authenticated', async () => {
      const unauthorized = Object.assign(new Error('Unauthorized'), { statusCode: 401 })
      mockRequireUserSession.mockRejectedValue(unauthorized)

      await expect(checkAuth(event, [UserRole.Admin])).rejects.toBe(unauthorized)
    })
  })

  describe('checkAuthWithOnlySelfStudentData', async () => {
    it('return session if user is a student and numEtu matches', async () => {
      const session = sessionWithRole(UserRole.Student, '123456')
      mockRequireUserSession.mockResolvedValue(session)

      await expect(checkAuthWithOnlySelfStudentData(event, '123456', [UserRole.Student])).resolves.toBe(session)
    })

    it('return 403 error if user is a student and numEtu does not match', async () => {
      const session = sessionWithRole(UserRole.Student, '123456')
      mockRequireUserSession.mockResolvedValue(session)

      await expect(checkAuthWithOnlySelfStudentData(event, '654321', [UserRole.Student])).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Forbidden'
      })
    })

    it('return session if user is not a student and role is allowed', async () => {
      const session = sessionWithRole(UserRole.Admin)
      mockRequireUserSession.mockResolvedValue(session)

      await expect(checkAuthWithOnlySelfStudentData(event, '123456', [UserRole.Admin])).resolves.toBe(session)
    })
  })
})
