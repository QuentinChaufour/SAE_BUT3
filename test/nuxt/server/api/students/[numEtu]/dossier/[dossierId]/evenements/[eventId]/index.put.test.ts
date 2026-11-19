import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    demarcheEvenement: {
      update: vi.fn()
    },
    demarcheRechercheContact: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Student, numId: 'o123456789' }
}))

vi.stubGlobal(
  'getValidatedRouterParams',
  async (
    event: H3Event,
    parse: (params: unknown) => unknown
  ) => parse(event.context.params)
)
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

let handler: typeof import('~~/server/api/students/[numEtu]/dossier/[dossierId]/evenements/[eventId]/index.put')['default']

const numEtu = 'o123456789'
const dossierId = '12'
const eventId = '21'
const body = {
  titre: 'Entretien téléphonique',
  description: 'Mise à jour de l’échange',
  date: '2026-03-15T10:00:00.000Z',
  source: 'Telephone',
  status: 'Entretien',
  contacts: [8, 9]
} as const

describe('PUT /api/students/[numEtu]/dossier/:dossierId/evenements/:eventId', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/dossier/[dossierId]/evenements/[eventId]/index.put'
    )).default
  })

  it('update an event and synchronize its contacts', async () => {
    const updatedEvent = {
      idDemarche: 21,
      idRecherche: 12,
      titre: body.titre,
      description: body.description,
      date: new Date(body.date),
      source: body.source,
      status: body.status
    }
    const contacts = [
      { idContact: 8, nom: 'Durand' },
      { idContact: 9, nom: 'Martin' }
    ]

    vi.mocked(prisma.demarcheEvenement.update).mockResolvedValue(updatedEvent as never)
    vi.mocked(prisma.demarcheRechercheContact.findMany)
      .mockResolvedValueOnce([
        { DemarcheContact: { idContact: 7 } },
        { DemarcheContact: { idContact: 8 } }
      ] as never)
      .mockResolvedValueOnce(
        contacts.map(DemarcheContact => ({ DemarcheContact })) as never
      )

    const event = {
      context: {
        params: { numEtu, dossierId, eventId },
        body
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.demarcheEvenement.update).toHaveBeenCalledWith({
      where: {
        idRecherche: 12,
        idDemarche: 21
      },
      data: {
        titre: body.titre,
        description: body.description,
        date: new Date(body.date),
        source: body.source,
        status: body.status
      }
    })
    expect(prisma.demarcheRechercheContact.create).toHaveBeenCalledWith({
      data: {
        idDemarche: 21,
        idContact: 9
      }
    })
    expect(prisma.demarcheRechercheContact.delete).toHaveBeenCalledWith({
      where: {
        idDemarche_idContact: {
          idContact: 7,
          idDemarche: 21
        }
      }
    })
    expect(response).toEqual({
      statusCode: 200,
      data: {
        ...updatedEvent,
        contacts
      }
    })
  })

  it('remove all existing contacts when no contacts are provided', async () => {
    const updatedEvent = {
      idDemarche: 21,
      titre: body.titre,
      date: new Date(body.date),
      source: body.source,
      status: body.status
    }

    vi.mocked(prisma.demarcheEvenement.update).mockResolvedValue(updatedEvent as never)
    vi.mocked(prisma.demarcheRechercheContact.findMany)
      .mockResolvedValueOnce([
        { DemarcheContact: { idContact: 7 } },
        { DemarcheContact: { idContact: 8 } }
      ] as never)
      .mockResolvedValueOnce([])

    const event = {
      context: {
        params: { numEtu, dossierId, eventId },
        body: { ...body, contacts: undefined }
      }
    } as unknown as H3Event

    await handler(event)

    expect(prisma.demarcheRechercheContact.delete).toHaveBeenCalledTimes(2)
    expect(prisma.demarcheRechercheContact.create).not.toHaveBeenCalled()
  })

  it('return not found when the event does not exist', async () => {
    vi.mocked(prisma.demarcheEvenement.update).mockResolvedValue(null as never)

    const event = {
      context: {
        params: { numEtu, dossierId, eventId },
        body
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 404 })
    expect((response as unknown as { error: Error }).error.message).toContain('événement')
    expect(prisma.demarcheRechercheContact.findMany).not.toHaveBeenCalled()
  })

  it('reject request if route parameters are invalid', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId: 'invalid', eventId: 'not-a-number' },
        body
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheEvenement.update).not.toHaveBeenCalled()
  })

  it('reject request if the event body is invalid', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId, eventId },
        body: { ...body, source: 'Invalid source' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheEvenement.update).not.toHaveBeenCalled()
  })
})
