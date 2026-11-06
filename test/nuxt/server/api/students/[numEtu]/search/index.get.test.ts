import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import type { Recherche_Stage_Status } from '~~/generated/prisma/enums'
import UserRole from '~~/shared/types/role'

interface RechercheStageType {
  idRecherche: number
  titre: string
  alternance: boolean
  dateDerniereModification: Date
  status: Recherche_Stage_Status
  DepartementTagRecherche: {
    DepartementTag: {
      nomTag: string
    }
  }[]
  Entreprise: {
    nom: string
    ville: string
  }
}

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    rechercheStage: {
      findMany: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal(
  'getValidatedRouterParams',
  async (
    event: H3Event,
    parse: (params: unknown) => unknown
  ) => parse(event.context.params)
)
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Student, numId: 'o123456789' }
}))

let handler: typeof import('~~/server/api/students/[numEtu]/search/index.get')['default']

describe('GET /api/student/[numEtu]/search', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/search/index.get'
    )).default
  })

  it('get the list of searches', async () => {
    const mockResults: RechercheStageType[] = [
      {
        idRecherche: 1,
        titre: 'Stage Développeur Fullstack',
        dateDerniereModification: new Date(),
        alternance: true,
        status: 'AttenteReponse',
        Entreprise: {
          nom: 'Tech Company',
          ville: 'Paris'
        },
        DepartementTagRecherche: []
      }
    ]

    vi.mocked(prisma.rechercheStage.findMany).mockResolvedValue(mockResults as never)

    const event = {
      context: {
        params: { numEtu: 'o123456789' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.rechercheStage.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.rechercheStage.findMany).toHaveBeenCalledWith({
      where: { numEtu: 'o123456789' },
      orderBy: { dateCreation: 'desc' },
      select: expect.any(Object)
    })
    expect(response).toEqual(mockResults)
  })

  it('reject request if invalid params', async () => {
    const event = {
      context: {
        params: { numEtu: 'INVALID_ID_xxxxxxxxxxx' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()

    expect(prisma.rechercheStage.findMany).not.toHaveBeenCalled()
  })
})
