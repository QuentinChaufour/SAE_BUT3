import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    demarcheEvenement: {
      create: vi.fn()
    },
    demarcheRechercheContact: {
      findMany: vi.fn()
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

let handler: typeof import('~~/server/api/students/[numEtu]/dossier/[dossierId]/evenements/index.post')['default']

const numEtu = 'o123456789'
const dossierId = '12'
const body = {
  titre: 'Entretien téléphonique',
  description: 'Premier échange avec l’entreprise',
  date: '15/03/2026',
  source: 'Telephone',
  status: 'AttenteEnvoi',
  contacts: [7, 8]
} as const

describe('POST /api/students/[numEtu]/dossier/:dossierId/evenements', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/dossier/[dossierId]/evenements/index.post'
    )).default
  })

  it('create an event with its contacts', async () => {
    const newEvent = {
      idDemarche: 21,
      idRecherche: 12,
      titre: body.titre,
      description: body.description,
      date: new Date(2026, 2, 14),
      source: body.source,
      status: body.status
    }
    const contacts = [
      { idContact: 7, nom: 'Durand' },
      { idContact: 8, nom: 'Martin' }
    ]

    vi.mocked(prisma.demarcheEvenement.create).mockResolvedValue(newEvent as never)
    vi.mocked(prisma.demarcheRechercheContact.findMany).mockResolvedValue(
      contacts.map(DemarcheContact => ({ DemarcheContact })) as never
    )

    const event = {
      context: {
        params: { numEtu, dossierId },
        body
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.demarcheEvenement.create).toHaveBeenCalledWith({
      data: {
        idRecherche: 12,
        titre: body.titre,
        description: body.description,
        date: new Date(2026, 2, 14),
        source: body.source,
        status: body.status,
        DemarcheRechercheContact: {
          create: [
            { idContact: 7 },
            { idContact: 8 }
          ]
        }
      }
    })
    expect(prisma.demarcheRechercheContact.findMany).toHaveBeenCalledWith({
      where: { idDemarche: 21 },
      select: { DemarcheContact: true }
    })
    expect(response).toEqual({
      statusCode: 201,
      data: {
        ...newEvent,
        contacts
      }
    })
  })

  it('create an event without contacts when contacts are omitted', async () => {
    const newEvent = {
      idDemarche: 21,
      titre: body.titre,
      date: new Date(2026, 2, 14),
      source: body.source,
      status: body.status
    }
    vi.mocked(prisma.demarcheEvenement.create).mockResolvedValue(newEvent as never)
    vi.mocked(prisma.demarcheRechercheContact.findMany).mockResolvedValue([])

    const event = {
      context: {
        params: { numEtu, dossierId },
        body: { ...body, contacts: undefined }
      }
    } as unknown as H3Event

    await handler(event)

    expect(prisma.demarcheEvenement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          DemarcheRechercheContact: { create: [] }
        })
      })
    )
  })

  it('return an error when event creation fails', async () => {
    vi.mocked(prisma.demarcheEvenement.create).mockResolvedValue(null as never)

    const event = {
      context: {
        params: { numEtu, dossierId },
        body
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 500 })
    expect(prisma.demarcheRechercheContact.findMany).not.toHaveBeenCalled()
  })

  it('reject request if the dossier ID is invalid', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId: 'invalid' },
        body
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheEvenement.create).not.toHaveBeenCalled()
  })

  it('reject request if the event body is invalid', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId },
        body: { ...body, date: '2026-03-15' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheEvenement.create).not.toHaveBeenCalled()
  })
})
