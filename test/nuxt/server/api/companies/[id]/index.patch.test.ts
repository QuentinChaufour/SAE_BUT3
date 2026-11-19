import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { entreprise: { update: vi.fn() } }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)
vi.stubGlobal(
  'readValidatedBody',
  async (event: H3Event, parse: (body: unknown) => unknown) => parse(event.context.body)
)
vi.stubGlobal('requireUserSession', async () => ({ user: { role: UserRole.Secretary } }))

let handler: typeof import('~~/server/api/companies/[id]/index.patch')['default']

describe('PATCH /api/companies/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/companies/[id]/index.patch')).default
  })

  it('updates a company', async () => {
    const body = {
      nom: 'Entreprise B',
      nomEtab: 'Campus B',
      adresse: '20 avenue Foch',
      codePostal: '69001',
      ville: 'Lyon',
      siret: '12345678901234',
      pays: 'France'
    }
    vi.mocked(prisma.entreprise.update).mockResolvedValue({ idEntreprise: 1, ...body } as never)

    const response = await handler({ context: { params: { id: '1' }, body } } as unknown as H3Event)

    expect(prisma.entreprise.update).toHaveBeenCalledWith({
      where: { idEntreprise: 1 },
      data: body
    })
    expect(response).toEqual({ idEntreprise: 1, ...body })
  })

  it('rejects invalid company data', async () => {
    await expect(handler({
      context: { params: { id: '1' }, body: { nom: '' } }
    } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.entreprise.update).not.toHaveBeenCalled()
  })
})
