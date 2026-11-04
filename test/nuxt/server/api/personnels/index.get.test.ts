import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { Personnel_Role } from '~~/generated/prisma/enums'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { personnel: { findMany: vi.fn() } }
}))

vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Admin }
}))

vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getValidatedQuery', async (event: { query?: unknown }, validate: (data: unknown) => unknown) =>
  validate(event.query ?? {})
)

const mockResults = [
  { numPersonnel: 'p1234567', nom: 'Dupont', prenom: 'Jean', role: Personnel_Role.admin },
  { numPersonnel: 'p7654321', nom: 'Martin', prenom: 'Claire', role: Personnel_Role.secretariat }
]

const baseArgs = {
  where: {},
  select: {
    numPersonnel: true,
    nom: true,
    prenom: true,
    role: true
  },
  orderBy: { numPersonnel: 'asc' }
}

let handler: typeof import('~~/server/api/personnels/index.get')['default']

function callHandler(query: Record<string, unknown> = {}) {
  return handler({ query } as unknown as H3Event)
}

describe('GET /api/personnels', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    vi.mocked(prisma.personnel.findMany).mockResolvedValue(mockResults as never)
    handler = (await import('~~/server/api/personnels/index.get')).default
  })

  it('get list of personnels filter', async () => {
    const response = await callHandler()

    expect(prisma.personnel.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.personnel.findMany).toHaveBeenCalledWith(baseArgs)
    expect(response).toEqual(mockResults)
  })

  it('filter by department_id', async () => {
    await callHandler({ department_id: '3' })

    expect(prisma.personnel.findMany).toHaveBeenCalledWith({
      ...baseArgs,
      where: {
        Appartenir: {
          some: {
            idDepartement: 3,
            dateDebut: { lte: new Date() },
            OR: [
              { dateFin: { gt: new Date() } },
              { dateFin: null }
            ]
          }
        }
      }
    })
  })

  it('filter by search', async () => {
    await callHandler({ search: 'Dupont' })

    expect(prisma.personnel.findMany).toHaveBeenCalledWith({
      ...baseArgs,
      where: {
        OR: [
          { nom: { contains: 'Dupont', mode: 'insensitive' } },
          { prenom: { contains: 'Dupont', mode: 'insensitive' } },
          { numPersonnel: { contains: 'Dupont', mode: 'insensitive' } }
        ]
      }
    })
  })

  it.each([Personnel_Role.admin, Personnel_Role.secretariat])('filter by role', async (role) => {
    await callHandler({ role })
    expect(prisma.personnel.findMany).toHaveBeenCalledWith({
      ...baseArgs,
      where: { role }
    })
  })

  it('use department_id and role filters', async () => {
    await callHandler({ department_id: '2', role: Personnel_Role.secretariat })

    expect(prisma.personnel.findMany).toHaveBeenCalledWith({
      ...baseArgs,
      where: {
        Appartenir: {
          some: {
            idDepartement: 2,
            dateDebut: { lte: new Date() },
            OR: [
              { dateFin: { gt: new Date() } },
              { dateFin: null }
            ]
          }
        },
        role: Personnel_Role.secretariat
      }
    })
  })

  it('return an empty list when no personnel matches', async () => {
    vi.mocked(prisma.personnel.findMany).mockResolvedValueOnce([] as never)

    const response = await callHandler({ department_id: '99' })
    expect(response).toEqual([])
  })

  it.each(['0', 'abc', '-1', '0.5'])('reject an invalid department_id (%s)', async (value) => {
    await expect(callHandler({ department_id: value })).rejects.toThrow()
    expect(prisma.personnel.findMany).not.toHaveBeenCalled()
  })

  it('reject an invalid role', async () => {
    await expect(callHandler({ role: 'student' })).rejects.toThrow()
    expect(prisma.personnel.findMany).not.toHaveBeenCalled()
  })
})
