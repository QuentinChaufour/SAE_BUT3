import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findManyFormation: vi.fn(),
  findManyStage: vi.fn(),
  findManySoutenance: vi.fn(),
  transaction: vi.fn(),
  getQuery: vi.fn()
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    formation: { findMany: mocks.findManyFormation },
    stage: { findMany: mocks.findManyStage },
    soutenance: { findMany: mocks.findManySoutenance },
    $transaction: mocks.transaction
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getQuery', mocks.getQuery)
vi.stubGlobal(
  'createError',
  (error: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(error.statusMessage), error)
)

describe('GET /api/classes/summary/soutenances', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getQuery.mockReturnValue({ idDepartement: '7' })
    mocks.findManyFormation.mockResolvedValue([
      {
        nomFormation: 'Informatique',
        alternance: false,
        Inscription: [{ numEtu: 'E1' }, { numEtu: 'E2' }]
      },
      {
        nomFormation: 'Réseaux',
        alternance: true,
        Inscription: [{ numEtu: 'E3' }]
      }
    ])
    mocks.findManyStage.mockResolvedValue([
      { idStage: 10, numEtu: 'E1' },
      { idStage: 11, numEtu: 'E2' },
      { idStage: 12, numEtu: 'E3' }
    ])
    mocks.findManySoutenance.mockResolvedValue([
      {
        idSoutenance: 100,
        SoutenanceStage: [{ idStage: 10 }]
      },
      {
        idSoutenance: 100,
        SoutenanceStage: [{ idStage: 11 }]
      },
      {
        idSoutenance: 101,
        SoutenanceStage: [{ idStage: 10 }]
      },
      {
        idSoutenance: 102,
        SoutenanceStage: [{ idStage: 999 }]
      }
    ])
    mocks.transaction.mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries))
  })

  it('rejects a non-integer department id', async () => {
    mocks.getQuery.mockReturnValue({ idDepartement: 'invalid' })
    const handler = (await import('~~/server/api/classes/summary/soutenances.get')).default

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'idDepartement doit être un entier'
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('counts distinct stages and soutenances linked to each formation', async () => {
    const handler = (await import('~~/server/api/classes/summary/soutenances.get')).default

    await expect(handler({})).resolves.toEqual([
      {
        name: 'Informatique',
        alternance: false,
        stages: 2,
        soutenances: 2
      },
      {
        name: 'Réseaux',
        alternance: true,
        stages: 1,
        soutenances: 0
      }
    ])

    expect(mocks.findManySoutenance).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ annee: '2026-2027' })
    }))
  })
})
