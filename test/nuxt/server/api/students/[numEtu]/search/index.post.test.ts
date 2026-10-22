import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    rechercheStage: {
      create: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)
vi.stubGlobal(
  'readValidatedBody',
  async (event: H3Event, parse: (body: unknown) => unknown) => parse(event.context.body)
)

let handler: typeof import('~~/server/api/students/[numEtu]/search/index.post')['default']

const numEtu = 'o123456789'

describe('POST /api/students/[numEtu]/search', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/search/index.post'
    )).default
  })

  it('create a new search', async () => {
    const validBody = {
      titre: 'Stage Développeur Nuxt',
      description: 'Développement d’applications web',
      alternance: true,
      annee: '2026-2027',
      idEntreprise: 1
    }

    const mockCreatedRecord = {
      idRecherche: 10,
      numEtu,
      ...validBody,
      dateCreation: new Date(),
      dateDerniereModification: new Date()
    }

    vi.mocked(prisma.rechercheStage.create).mockResolvedValue(mockCreatedRecord as never)

    const event = {
      context: {
        params: { numEtu },
        body: validBody
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.rechercheStage.create).toHaveBeenCalledTimes(1)
    expect(prisma.rechercheStage.create).toHaveBeenCalledWith({
      data: {
        titre: validBody.titre,
        description: validBody.description,
        alternance: validBody.alternance,
        annee: validBody.annee,
        idEntreprise: validBody.idEntreprise,
        numEtu
      }
    })
    expect(response).toEqual(mockCreatedRecord)
  })

  it('reject request if invalid body', async () => {
    const invalidBody = {
      titre: '',
      alternance: false,
      idEntreprise: null
    }

    const event = {
      context: {
        params: { numEtu },
        body: invalidBody
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()

    expect(prisma.rechercheStage.create).not.toHaveBeenCalled()
  })
})
