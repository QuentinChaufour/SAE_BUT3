import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import type { Departement } from '~~/generated/prisma/client'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    departement: {
      findUnique: vi.fn()
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
  user: { role: UserRole.Admin, numId: 'p123456789' }
}))

type DepartementGetType = Departement & {
  DepartementTag: {
    idTag: number
    nomTag: string
  }[]
}

let handler: typeof import('~~/server/api/departments/[id]/index.get')['default']

describe('GET /api/departments/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/departments/[id]/index.get')).default
  })

  it('get the list of searches', async () => {
    const mockResult: DepartementGetType = {
      idDepartement: 1,
      nom: 'Informatique',
      anneeActuelle: '2026-2027',
      DepartementTag: [{ idTag: 1, nomTag: 'Backend' }]
    }

    vi.mocked(prisma.departement.findUnique).mockResolvedValue(mockResult as never)

    const event = { context: { params: { id: '1' } } } as unknown as H3Event
    const response = await handler(event)

    expect(prisma.departement.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.departement.findUnique).toHaveBeenCalledWith({
      where: { idDepartement: 1 },
      select: expect.any(Object)
    })
    expect(response).toEqual(mockResult)
  })

  it('reject request if invalid params', async () => {
    const event = { context: { params: { id: 'INVALID_ID_xxxxxxxxxxx' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()

    expect(prisma.departement.findUnique).not.toHaveBeenCalled()
  })
})
