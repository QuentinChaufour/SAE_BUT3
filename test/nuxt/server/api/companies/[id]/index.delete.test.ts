import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { entreprise: { delete: vi.fn() } }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)
vi.stubGlobal('sendNoContent', () => ({ status: 204 }))
vi.stubGlobal('requireUserSession', async () => ({ user: { role: UserRole.Secretary } }))

let handler: typeof import('~~/server/api/companies/[id]/index.delete')['default']

describe('DELETE /api/companies/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/companies/[id]/index.delete')).default
  })

  it('deletes a company', async () => {
    vi.mocked(prisma.entreprise.delete).mockResolvedValue({ idEntreprise: 1 } as never)

    const response = await handler({ context: { params: { id: '1' } } } as unknown as H3Event)

    expect(prisma.entreprise.delete).toHaveBeenCalledWith({ where: { idEntreprise: 1 } })
    expect(response).toEqual({ status: 204 })
  })

  it('rejects invalid ids', async () => {
    await expect(handler({ context: { params: { id: 'invalid' } } } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.entreprise.delete).not.toHaveBeenCalled()
  })

  it('rejects when Prisma returns no deleted company', async () => {
    vi.mocked(prisma.entreprise.delete).mockResolvedValue(null as never)
    await expect(handler({ context: { params: { id: '99' } } } as unknown as H3Event)).rejects.toThrow()
  })
})
