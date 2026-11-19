import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { rechercheStage: { findMany: vi.fn() } }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)
vi.stubGlobal(
  'getValidatedQuery',
  async (event: H3Event, parse: (query: unknown) => unknown) => parse(event.context.query)
)
vi.stubGlobal('requireUserSession', async () => ({ user: { role: UserRole.Secretary } }))

let handler: typeof import('~~/server/api/companies/[id]/student-search/index.get')['default']

describe('GET /api/companies/[id]/student-search', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/companies/[id]/student-search/index.get')).default
  })

  it('returns student searches matching company, department and year', async () => {
    const searches = [{ idRecherche: 1, titre: 'Développeur web' }]
    vi.mocked(prisma.rechercheStage.findMany).mockResolvedValue(searches as never)

    const response = await handler({
      context: { params: { id: '7' }, query: { idDept: '2', year: '2026-2027' } }
    } as unknown as H3Event)

    expect(prisma.rechercheStage.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        idEntreprise: 7,
        Inscription: { annee: '2026-2027', Formation: { idDepartement: 2 } }
      }
    }))
    expect(response).toEqual(searches)
  })

  it('rejects invalid query parameters', async () => {
    await expect(handler({
      context: { params: { id: '7' }, query: { idDept: '0', year: 'invalid' } }
    } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.rechercheStage.findMany).not.toHaveBeenCalled()
  })
})
