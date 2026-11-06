import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import type { Departement } from '~~/generated/prisma/client'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    departement: {
      findMany: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Admin, numId: 'p123456789' }
}))

const mockResults: Pick<Departement, 'idDepartement' | 'nom'>[] = [
  { idDepartement: 1, nom: 'Informatique' },
  { idDepartement: 2, nom: 'Chimie' }
]

let handler: typeof import('~~/server/api/departments/index.get')['default']

describe('GET /api/departments', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/departments/index.get')).default
  })

  it('get the list of searches', async () => {
    vi.mocked(prisma.departement.findMany).mockResolvedValue(mockResults as never)

    const response = await handler({} as unknown as H3Event)

    expect(prisma.departement.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.departement.findMany).toHaveBeenCalledWith({
      orderBy: { idDepartement: 'desc' },
      select: expect.any(Object)
    })
    expect(response).toEqual(mockResults)
  })
})
