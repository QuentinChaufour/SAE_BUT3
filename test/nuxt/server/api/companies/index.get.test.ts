import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { Recherche_Stage_Status } from '~~/generated/prisma/client'

interface EntrepriseType {
  idEntreprise: number
  nom: string
  ville: string
  codePostal: string
}

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    entreprise: {
      findMany: vi.fn()
    }
  }
}))

let userRole = UserRole.Student

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: userRole }
}))
vi.stubGlobal(
  'getValidatedQuery',
  async (
    event: H3Event,
    parse: (query: unknown) => unknown
  ) => parse(event.context.query)
)

let handler: typeof import('~~/server/api/companies/index.get')['default']

describe('GET /api/entreprises', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    userRole = UserRole.Student
    handler = (await import('~~/server/api/companies/index.get')).default
  })

  it('return companies matching a valid search query', async () => {
    const mockEntreprises: EntrepriseType[] = [
      {
        idEntreprise: 1,
        nom: 'Entreprise A',
        ville: 'Paris',
        codePostal: '75000'
      }
    ]

    vi.mocked(prisma.entreprise.findMany).mockResolvedValue(mockEntreprises as never)

    const event = {
      context: {
        query: { search: 'Alpha' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.entreprise.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.entreprise.findMany).toHaveBeenCalledWith({
      where: { nom: { contains: 'Alpha', mode: 'insensitive' } },
      take: 10,
      select: {
        idEntreprise: true,
        nom: true,
        ville: true,
        codePostal: true,
        adresse: true,
        nomEtab: true,
        pays: true,
        siret: true
      }
    })
    expect(response).toEqual(mockEntreprises)
  })

  it('returns application counts to secretaries and teachers', async () => {
    userRole = UserRole.Secretary
    vi.mocked(prisma.entreprise.findMany).mockResolvedValue([{
      idEntreprise: 1,
      nom: 'Entreprise A',
      ville: 'Paris',
      codePostal: '75000',
      _count: { RechercheStage: 3 },
      RechercheStage: [{ idRecherche: 1 }]
    }] as never)

    const event = {
      context: {
        query: { search: 'Alpha' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.entreprise.findMany).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        _count: {
          select: {
            RechercheStage: true
          }
        },
        RechercheStage: {
          where: { status: Recherche_Stage_Status.Accepte },
          select: { idRecherche: true }
        }
      })
    }))
    expect(response).toEqual([expect.objectContaining({
      nbCandidatures: 3,
      nbAcceptedCandidatures: 1
    })])
  })

  it('reject request with empty search parameter', async () => {
    const event = { context: { query: { search: '' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()

    expect(prisma.entreprise.findMany).not.toHaveBeenCalled()
  })

  it('rejects a student request without a search', async () => {
    await expect(handler({ context: { query: {} } } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.entreprise.findMany).not.toHaveBeenCalled()
  })

  it('filters by department and does not limit secretary results', async () => {
    userRole = UserRole.Secretary
    vi.mocked(prisma.entreprise.findMany).mockResolvedValue([])

    await handler({
      context: { query: { idDepartment: '2' } }
    } as unknown as H3Event)

    expect(prisma.entreprise.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        RechercheStage: {
          some: {
            Inscription: {
              Formation: { idDepartement: 2 }
            }
          }
        }
      },
      take: undefined
    }))
  })
})
