import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    anneeEnseignant: {
      findMany: vi.fn()
    },
    appartenir: {
      findMany: vi.fn()
    },
    inscription: {
      findMany: vi.fn()
    }
  }
}))

vi.mock('~~/server/utils/middleware', () => ({
  checkAuth: vi.fn()
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})

let handler: typeof import('~~/server/api/me/personnel.get')['default']

describe('GET /api/me/personnel', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/me/personnel.get')).default
  })

  it('fetches departments and years for a teacher', async () => {
    vi.mocked(checkAuth).mockResolvedValue({
      user: { role: UserRole.Teacher, numId: 'p123' }
    } as never)

    vi.mocked(prisma.anneeEnseignant.findMany).mockResolvedValue([
      {
        Departement: {
          idDepartement: 1,
          nom: 'Informatique',
          anneeActuelle: '2026-2027'
        }
      }
    ] as never)

    vi.mocked(prisma.inscription.findMany).mockResolvedValue([
      { annee: '2025-2026' }
    ] as never)

    const event = {} as H3Event
    const response = await handler(event)

    expect(checkAuth).toHaveBeenCalledWith(event, [UserRole.Teacher, UserRole.Secretary])
    expect(prisma.anneeEnseignant.findMany).toHaveBeenCalledWith({
      where: { numEnseignant: 'p123' },
      select: { Departement: { select: { idDepartement: true, nom: true, anneeActuelle: true } } }
    })
    expect(prisma.inscription.findMany).toHaveBeenCalledWith({
      where: {
        Formation: { idFormation: 1 },
        RechercheStage: { some: {} }
      },
      select: { annee: true },
      distinct: ['annee'],
      orderBy: { annee: 'desc' }
    })

    expect(response).toEqual([
      {
        annees: ['2025-2026', '2026-2027'],
        departement: {
          id: 1,
          nom: 'Informatique'
        }
      }
    ])
  })

  it('fetches departments and years for a secretary', async () => {
    vi.mocked(checkAuth).mockResolvedValue({
      user: { role: UserRole.Secretary, numId: 'p456' }
    } as never)

    vi.mocked(prisma.appartenir.findMany).mockResolvedValue([
      {
        Departement: {
          idDepartement: 2,
          nom: 'Chimie',
          anneeActuelle: '2026-2027'
        }
      }
    ] as never)

    vi.mocked(prisma.inscription.findMany).mockResolvedValue([
      { annee: '2026-2027' }
    ] as never)

    const event = {} as H3Event
    const response = await handler(event)

    expect(checkAuth).toHaveBeenCalledWith(event, [UserRole.Teacher, UserRole.Secretary])
    expect(prisma.appartenir.findMany).toHaveBeenCalledWith({
      where: { numPersonnel: 'p456' },
      select: { Departement: { select: { idDepartement: true, nom: true, anneeActuelle: true } } }
    })

    expect(response).toEqual([
      {
        annees: ['2026-2027'],
        departement: {
          id: 2,
          nom: 'Chimie'
        }
      }
    ])
  })
})
