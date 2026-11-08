import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    rechercheStage: {
      update: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
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
  (_event: H3Event, error: Error) => ({ statusCode: (error as Error & { statusCode: number }).statusCode, error })
)

let handler: typeof import('~~/server/api/dossier/[dossierId]/index.patch')['default']

const dossierId = '12'

describe('PATCH /api/dossier/:dossierId', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/dossier/[dossierId]/index.patch')).default
  })

  it('update a dossier', async () => {
    const body = {
      titre: 'Stage développeur',
      description: 'Recherche de stage',
      alternance: true
    }
    const updatedDossier = {
      idRecherche: 12,
      ...body
    }

    vi.mocked(prisma.rechercheStage.update).mockResolvedValue(updatedDossier as never)

    const event = {
      context: {
        params: { dossierId },
        body
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.rechercheStage.update).toHaveBeenCalledTimes(1)
    expect(prisma.rechercheStage.update).toHaveBeenCalledWith({
      where: { idRecherche: 12 },
      data: body
    })
    expect(response).toEqual({
      statusCode: 200,
      data: updatedDossier
    })
  })

  it('reject request if no data is provided', async () => {
    const event = {
      context: {
        params: { dossierId },
        body: {}
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 400 })
    expect(prisma.rechercheStage.update).not.toHaveBeenCalled()
  })

  it('reject request if the dossier ID is invalid', async () => {
    const event = {
      context: {
        params: { dossierId: 'invalid' },
        body: { titre: 'Stage développeur' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.rechercheStage.update).not.toHaveBeenCalled()
  })

  it('return not found when the dossier does not exist', async () => {
    vi.mocked(prisma.rechercheStage.update).mockResolvedValue(null as never)

    const event = {
      context: {
        params: { dossierId },
        body: { titre: 'Stage développeur' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 404 })
  })
})
