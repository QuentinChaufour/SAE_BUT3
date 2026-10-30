import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      const tx = {
        departementTag: { deleteMany: vi.fn() },
        formation: { deleteMany: vi.fn() },
        anneeEnseignant: { deleteMany: vi.fn() },
        appartenir: { deleteMany: vi.fn() },
        departement: { delete: vi.fn() }
      }
      return await callback(tx)
    })
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
vi.stubGlobal('sendNoContent', (event: H3Event, code?: number) => ({ status: code || 204 }))
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Admin, numId: 'p123456789' }
}))

let handler: typeof import('~~/server/api/departments/[id]/index.delete')['default']

describe('DELETE /api/departments/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/departments/[id]/index.delete')).default
  })

  it('delete department and associated data successfully', async () => {
    const event = { context: { params: { id: '1' } } } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(response).toEqual({ status: 204 })
  })

  it('reject request if invalid params id', async () => {
    const event = { context: { params: { id: 'INVALID_ID' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
