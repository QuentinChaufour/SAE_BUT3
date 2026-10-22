import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  clearUserSession: vi.fn()
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    auth: {
      findFirst: mocks.findFirst,
      update: mocks.update
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('hashPassword', mocks.hashPassword)
vi.stubGlobal('verifyPassword', mocks.verifyPassword)
vi.stubGlobal('clearUserSession', mocks.clearUserSession)

vi.stubGlobal(
  'createError',
  (error: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(error.statusMessage), error)
)

vi.stubGlobal(
  'readValidatedBody',
  async (_event: unknown, parse: (body: unknown) => unknown) => {
    return parse({
      login: 'o00000001',
      oldPassword: 'oldPassword',
      newPassword: 'newPassword'
    })
  }
)

describe('POST /api/auth/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the password and clears the user session', async () => {
    const event = {}

    mocks.hashPassword.mockResolvedValue('hashedNewPassword')

    // define the found user
    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'hashedOldPassword'
    })

    // ensure the password verification
    mocks.verifyPassword.mockResolvedValue(true)
    mocks.update.mockResolvedValue({})

    const handler = (await import('~~/server/api/auth/password.post')).default

    // check that the API call is successful
    await expect(handler(event)).resolves.toEqual({
      success: true
    })

    expect(mocks.hashPassword).toHaveBeenCalledWith('newPassword')

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        login: 'o00000001'
      }
    })

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      'hashedOldPassword',
      'oldPassword'
    )

    // check that the password has been updated in DB
    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        login: 'o00000001'
      },
      data: {
        password: 'hashedNewPassword'
      }
    })

    // check that the session has been cleaned after update
    expect(mocks.clearUserSession).toHaveBeenCalledWith(event)
  })

  it('rejects an unknown login', async () => {
    mocks.hashPassword.mockResolvedValue('hashedNewPassword')
    mocks.findFirst.mockResolvedValue(null)

    const handler = (await import('~~/server/api/auth/password.post')).default

    // check no user has been found
    await expect(handler({})).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })

    // check that only necessary functions have been called
    expect(mocks.hashPassword).toHaveBeenCalledOnce()
    expect(mocks.verifyPassword).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.clearUserSession).not.toHaveBeenCalled()
  })

  it('rejects an incorrect old password', async () => {
    mocks.hashPassword.mockResolvedValue('hashedNewPassword')

    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'hashedOldPassword'
    })

    mocks.verifyPassword.mockResolvedValue(false)

    const handler = (await import('~~/server/api/auth/password.post')).default

    // check old password aren't the same
    await expect(handler({})).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })

    expect(mocks.hashPassword).toHaveBeenCalledWith('newPassword')

    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      'hashedOldPassword',
      'oldPassword'
    )

    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.clearUserSession).not.toHaveBeenCalled()
  })
})
