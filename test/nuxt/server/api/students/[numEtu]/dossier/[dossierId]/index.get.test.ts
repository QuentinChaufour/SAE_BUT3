import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    rechercheStage: {
      findUnique: vi.fn()
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

let handler: typeof import('~~/server/api/students/[numEtu]/dossier/[dossierId]/index.get')['default']

const numEtu = 'o123456789'
const dossierId = '12'

describe('GET /api/students/[numEtu]/dossier/:dossierId', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/students/[numEtu]/dossier/[dossierId]/index.get')).default
  })

  it('return the dossier with its related data', async () => {
    const dossier = {
      idRecherche: 12,
      description: 'Recherche de stage',
      titre: 'Stage développeur',
      alternance: true,
      Entreprise: {
        nom: 'Entreprise',
        adresse: '1 rue de Paris',
        codePostal: '75000',
        ville: 'Paris'
      },
      DemarcheEvenement: [],
      DepartementTagRecherche: []
    }

    vi.mocked(prisma.rechercheStage.findUnique).mockResolvedValue(dossier as never)

    const event = {
      context: {
        params: { numEtu, dossierId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.rechercheStage.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.rechercheStage.findUnique).toHaveBeenCalledWith({
      select: {
        idRecherche: true,
        description: true,
        titre: true,
        alternance: true,
        Entreprise: {
          select: {
            nom: true,
            adresse: true,
            codePostal: true,
            ville: true
          }
        },
        DemarcheEvenement: {
          select: {
            idDemarche: true,
            date: true,
            description: true,
            titre: true,
            status: true,
            source: true,
            LienPj: {
              select: {
                PieceJointe: {
                  select: {
                    idPieceJointe: true,
                    nom: true
                  }
                }
              }
            },
            DemarcheRechercheContact: {
              select: {
                DemarcheContact: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          }
        },
        DepartementTagRecherche: {
          select: {
            DepartementTag: true
          }
        }
      },
      where: {
        idRecherche: 12
      }
    })
    expect(response).toEqual({
      statusCode: 200,
      data: dossier
    })
  })

  it('return not found when the dossier does not exist', async () => {
    vi.mocked(prisma.rechercheStage.findUnique).mockResolvedValue(null)

    const event = {
      context: {
        params: { numEtu, dossierId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 404 })
    expect((response as unknown as { error: Error }).error.message).toBe('Dossier not found')
  })

  it('reject request if the dossier ID is invalid', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId: 'invalid' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.rechercheStage.findUnique).not.toHaveBeenCalled()
  })
})
