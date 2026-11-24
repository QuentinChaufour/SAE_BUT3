import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    demarcheContact: {
      create: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)

vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Student, numId: 'o123456789' }
}))

vi.stubGlobal(
  'readValidatedBody',
  async (
    event: H3Event,
    parse: (body: unknown) => unknown
  ) => parse(event.context.body)
)
vi.stubGlobal(
  'createError',
  (error: { statusCode: number, message: string }) => {
    const result = new Error(error.message)
    Object.assign(result, error)
    return result
  }
)
vi.stubGlobal(
  'sendError',
  (_event: H3Event, error: Error) => ({
    statusCode: (error as Error & { statusCode: number }).statusCode,
    error
  })
)

const numEtu = 'o123456789'

let handler: typeof import('~~/server/api/students/[numEtu]/dossier/[dossierId]/contacts/index.post')['default']

describe('POST /api/contacts', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/students/[numEtu]/dossier/[dossierId]/contacts/index.post')).default
  })

  it('create a contact', async () => {
    const body = {
      nom: 'Durand',
      prenom: 'Alice',
      email: 'alice@example.com',
      telephone: '0123456789',
      fonction: 'Responsable RH',
      idRecherche: 12
    }
    const contact = {
      idContact: 4,
      ...body
    }

    vi.mocked(prisma.demarcheContact.create).mockResolvedValue(contact as never)

    const event = {
      context: { params: { numEtu }, body }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.demarcheContact.create).toHaveBeenCalledWith({
      data: body
    })
    expect(response).toEqual({
      statusCode: 201,
      data: contact
    })
  })

  it('convert empty optional values to null before creating a contact', async () => {
    const body = {
      nom: 'Durand',
      prenom: 'Alice',
      email: '',
      telephone: '',
      idRecherche: 12
    }
    const contact = {
      idContact: 4,
      nom: body.nom,
      prenom: body.prenom,
      email: null,
      telephone: null,
      idRecherche: body.idRecherche
    }

    vi.mocked(prisma.demarcheContact.create).mockResolvedValue(contact as never)

    const event = {
      context: { params: { numEtu }, body }
    } as unknown as H3Event

    await handler(event)

    expect(prisma.demarcheContact.create).toHaveBeenCalledWith({
      data: {
        nom: body.nom,
        prenom: body.prenom,
        email: null,
        telephone: null,
        fonction: undefined,
        idRecherche: body.idRecherche
      }
    })
  })

  it('return an error when contact creation fails', async () => {
    vi.mocked(prisma.demarcheContact.create).mockResolvedValue(null as never)

    const body = {
      nom: 'Durand',
      prenom: 'Alice',
      idRecherche: 12
    }
    const event = {
      context: { params: { numEtu }, body }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 500 })
    expect((response as unknown as { error: Error }).error.message).toBe(
      'Erreur lors de la création du contact'
    )
  })

  it('reject request if the contact body is invalid', async () => {
    const event = {
      context: {
        body: {
          nom: '',
          prenom: 'Alice',
          idRecherche: 12
        }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheContact.create).not.toHaveBeenCalled()
  })
})
