import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
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

let handler: typeof import('~~/server/api/me/student.get')['default']

describe('GET /api/me/student', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/me/student.get')).default
  })

  it('fetches inscriptions for the connected student with readOnly status', async () => {
    vi.mocked(checkAuth).mockResolvedValue({
      user: { role: UserRole.Student, numId: 'o123456789' }
    } as never)

    vi.mocked(prisma.inscription.findMany).mockResolvedValue([
      {
        idInscription: 10,
        annee: '2026-2027',
        Formation: {
          nomFormation: 'BUT3 Informatique',
          Departement: {
            nom: 'Informatique',
            anneeActuelle: '2026-2027'
          }
        }
      },
      {
        idInscription: 20,
        annee: '2025-2026',
        Formation: {
          nomFormation: 'BUT2 Informatique',
          Departement: {
            nom: 'Informatique',
            anneeActuelle: '2026-2027'
          }
        }
      }
    ] as never)

    const event = {} as H3Event
    const response = await handler(event)

    expect(checkAuth).toHaveBeenCalledWith(event, [UserRole.Student])
    expect(prisma.inscription.findMany).toHaveBeenCalledWith({
      where: { numEtu: 'o123456789' },
      select: {
        idInscription: true,
        annee: true,
        Formation: {
          select: {
            nomFormation: true,
            Departement: { select: { nom: true, anneeActuelle: true } }
          }
        }
      }
    })

    expect(response).toEqual([
      {
        idInscription: 10,
        annee: '2026-2027',
        readOnly: false,
        formation: {
          nom: 'BUT3 Informatique',
          departement: 'Informatique'
        }
      },
      {
        idInscription: 20,
        annee: '2025-2026',
        readOnly: true,
        formation: {
          nom: 'BUT2 Informatique',
          departement: 'Informatique'
        }
      }
    ])
  })
})
