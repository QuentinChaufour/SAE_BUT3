import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  verifyPassword: vi.fn(),
  setUserSession: vi.fn()
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    auth: {
      findFirst: mocks.findFirst
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('verifyPassword', mocks.verifyPassword)
vi.stubGlobal('setUserSession', mocks.setUserSession)

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
      password: 'password123'
    })
  }
)

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets the session on valid credentials for student', async () => {
    // specify the user to be returned when searched
    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: null,
      Etudiant: {
        nom: 'Lyve',
        prenom: 'Sylvain'
      },
      Personnel: null
    })

    // ensure the password verification pass
    mocks.verifyPassword.mockResolvedValue(true)

    // define the handler and call it
    const handler = (await import('~~/server/api/auth/login.post')).default
    const event = {}
    await handler(event)

    // check if the right query has been made
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        login: 'o00000001'
      },
      include: {
        Enseignant: true,
        Etudiant: true,
        Personnel: true
      }
    })

    // check the right arguments for password verification
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      'password123',
      'password123'
    )

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'student',
        nom: 'Lyve',
        prenom: 'Sylvain'
      }
    })

    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: null,
      Etudiant: {
        nom: null,
        prenom: null
      },
      Personnel: null
    })

    await handler({})

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'student',
        nom: '',
        prenom: ''
      }
    })
  })

  it('sets the session on valid credentials for teacher', async () => {
    // specify the user to be returned when searched
    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: {
        nom: 'Lyve',
        prenom: 'Sylvain'
      },
      Etudiant: null,
      Personnel: null
    })

    // ensure the password verification pass
    mocks.verifyPassword.mockResolvedValue(true)

    // define the handler and call it
    const handler = (await import('~~/server/api/auth/login.post')).default
    const event = {}
    await handler(event)

    // check if the right query has been made
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        login: 'o00000001'
      },
      include: {
        Enseignant: true,
        Etudiant: true,
        Personnel: true
      }
    })

    // check the right arguments for password verification
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      'password123',
      'password123'
    )

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'teacher',
        nom: 'Lyve',
        prenom: 'Sylvain'
      }
    })

    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: {
        nom: null,
        prenom: null
      },
      Etudiant: null,
      Personnel: null
    })

    await handler({})

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'teacher',
        nom: '',
        prenom: ''
      }
    })
  })

  it('sets the session on valid credentials for secretary', async () => {
    // specify the user to be returned when searched
    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: null,
      Etudiant: null,
      Personnel: {
        nom: 'Lyve',
        prenom: 'Sylvain',
        role: 'secretary'
      }
    })

    // ensure the password verification pass
    mocks.verifyPassword.mockResolvedValue(true)

    // define the handler and call it
    const handler = (await import('~~/server/api/auth/login.post')).default
    const event = {}
    await handler(event)

    // check if the right query has been made
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        login: 'o00000001'
      },
      include: {
        Enseignant: true,
        Etudiant: true,
        Personnel: true
      }
    })

    // check the right arguments for password verification
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      'password123',
      'password123'
    )

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'secretary',
        nom: 'Lyve',
        prenom: 'Sylvain'
      }
    })

    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: null,
      Etudiant: null,
      Personnel: {
        nom: null,
        prenom: null,
        role: 'secretary'
      }
    })

    await handler({})

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'secretary',
        nom: '',
        prenom: ''
      }
    })
  })

  it('sets the session on valid credentials for admin', async () => {
    // specify the user to be returned when searched
    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: null,
      Etudiant: null,
      Personnel: {
        nom: 'Lyve',
        prenom: 'Sylvain',
        role: 'admin'
      }
    })

    // ensure the password verification pass
    mocks.verifyPassword.mockResolvedValue(true)

    // define the handler and call it
    const handler = (await import('~~/server/api/auth/login.post')).default
    const event = {}
    await handler(event)

    // check if the right query has been made
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        login: 'o00000001'
      },
      include: {
        Enseignant: true,
        Etudiant: true,
        Personnel: true
      }
    })

    // check the right arguments for password verification
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      'password123',
      'password123'
    )

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'admin',
        nom: 'Lyve',
        prenom: 'Sylvain'
      }
    })

    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'password123',
      Enseignant: null,
      Etudiant: null,
      Personnel: {
        nom: null,
        prenom: null,
        role: 'admin'
      }
    })

    await handler({})

    expect(mocks.setUserSession).toHaveBeenCalledWith(event, {
      user: {
        numId: 'o00000001',
        role: 'admin',
        nom: '',
        prenom: ''
      }
    })
  })

  it('rejects unknown login', async () => {
    mocks.findFirst.mockResolvedValue(null)

    // define the API event handler
    const handler = (await import('~~/server/api/auth/login.post')).default

    // reject API call
    await expect(handler({})).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })

    // rejects right after not finding the user
    expect(mocks.verifyPassword).not.toHaveBeenCalled()
    expect(mocks.setUserSession).not.toHaveBeenCalled()
  })

  it('rejects wrong password', async () => {
    mocks.findFirst.mockResolvedValue({
      login: 'o00000001',
      password: 'wrongPassword',
      Enseignant: null,
      Etudiant: {
        nom: 'Lyve',
        prenom: 'Sylvain'
      },
      Personnel: null
    })

    // ensure the password verification fail
    mocks.verifyPassword.mockResolvedValue(false)

    // define the API event handler
    const handler = (await import('~~/server/api/auth/login.post')).default

    // reject API call
    await expect(handler({})).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })

    // rejects right after failling password verification
    expect(mocks.setUserSession).not.toHaveBeenCalled()
  })
})
