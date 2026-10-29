import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

interface EntrepriseType {
  idEntreprise: number
  nom: string
  ville: string
  codePostal: string
}

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    entreprise: {
      findMany: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Student }
}))
vi.stubGlobal(
  'getValidatedQuery',
  async (
    event: H3Event,
    parse: (query: unknown) => unknown
  ) => parse(event.context.query)
)

let handler: typeof import('~~/server/api/companies/index.get')['default']

describe('GET /api/entreprises', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/companies/index.get')).default
  })

  it('return companies matching a valid search query', async () => {
    const mockEntreprises: EntrepriseType[] = [
      { idEntreprise: 1, nom: 'Entreprise A', ville: 'Paris', codePostal: '75000' }
    ]

    vi.mocked(prisma.entreprise.findMany).mockResolvedValue(mockEntreprises as never)

    const event = {
      context: {
        query: { search: 'Alpha' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.entreprise.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.entreprise.findMany).toHaveBeenCalledWith({
      where: { nom: { contains: 'Alpha', mode: 'insensitive' } },
      take: 10,
      select: {
        idEntreprise: true,
        nom: true,
        ville: true,
        codePostal: true
      }
    })
    expect(response).toEqual(mockEntreprises)
  })

  it('reject request with empty search parameter', async () => {
    const event = { context: { query: { search: '' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()

    expect(prisma.entreprise.findMany).not.toHaveBeenCalled()
  })
})
