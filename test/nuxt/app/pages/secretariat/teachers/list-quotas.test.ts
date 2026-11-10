import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getQuery: vi.fn()
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    enseignant: {
      findMany: mocks.findMany
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getQuery', mocks.getQuery)
vi.stubGlobal(
  'createError',
  (error: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(error.statusMessage), error)
)

describe('GET /api/teachers/list-quotas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getQuery.mockReturnValue({ idDepartement: '7' })
    mocks.findMany.mockResolvedValue([
      {
        nom: 'Durand',
        prenom: 'Alice',
        AnneeEnseignant: [
          {
            QuotaEnseignant: [
              {
                idFormation: 1,
                quotaTuteurs: 2,
                Formation: { nomFormation: 'Informatique', alternance: false }
              },
              {
                idFormation: 2,
                quotaTuteurs: 3,
                Formation: { nomFormation: 'Réseaux', alternance: true }
              }
            ]
          }
        ],
        Stage: [
          {
            idStage: 10,
            Etudiant: { Inscription: [{ idFormation: 1 }] }
          },
          {
            idStage: 11,
            Etudiant: { Inscription: [{ idFormation: 1 }, { idFormation: 2 }] }
          },
          {
            idStage: 12,
            Etudiant: { Inscription: [{ idFormation: 99 }] }
          }
        ]
      },
      {
        nom: null,
        prenom: null,
        AnneeEnseignant: [],
        Stage: []
      }
    ])
  })

  it('rejects a non-integer department id', async () => {
    mocks.getQuery.mockReturnValue({ idDepartement: 'invalid' })
    const handler = (await import('~~/server/api/teachers/list-quotas.get')).default

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'idDepartement doit être un entier'
    })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  it('returns teacher names and stage counts by formation quota', async () => {
    const handler = (await import('~~/server/api/teachers/list-quotas.get')).default

    await expect(handler({})).resolves.toEqual([
      {
        'Nom': 'DURAND Alice',
        'Stage Informatique': '2/2',
        'Alternance Réseaux': '1/3'
      },
      {
        Nom: ''
      }
    ])

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AnneeEnseignant: {
          some: {
            idDepartement: 7,
            annee: '2026-2027'
          }
        }
      }
    }))
  })
})
