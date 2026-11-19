import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { entreprise: { findUnique: vi.fn() } }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)
vi.stubGlobal('requireUserSession', async () => ({ user: { role: UserRole.Secretary } }))

let handler: typeof import('~~/server/api/companies/[id]/index.get')['default']

describe('GET /api/companies/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/companies/[id]/index.get')).default
  })

  it('returns the company name', async () => {
    vi.mocked(prisma.entreprise.findUnique).mockResolvedValue({ nom: 'Entreprise A' } as never)

    const response = await handler({ context: { params: { id: '1' } } } as unknown as H3Event)

    expect(prisma.entreprise.findUnique).toHaveBeenCalledWith({
      where: { idEntreprise: 1 },
      select: { nom: true }
    })
    expect(response).toEqual({ nom: 'Entreprise A' })
  })

  it('rejects an unknown company', async () => {
    vi.mocked(prisma.entreprise.findUnique).mockResolvedValue(null)

    await expect(handler({ context: { params: { id: '99' } } } as unknown as H3Event)).rejects.toThrow()
  })

  it('rejects an invalid id', async () => {
    await expect(handler({ context: { params: { id: 'invalid' } } } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.entreprise.findUnique).not.toHaveBeenCalled()
  })
})
