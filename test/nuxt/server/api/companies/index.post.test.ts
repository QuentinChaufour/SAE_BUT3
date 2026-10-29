import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

interface EntrepriseCreateType {
  nom: string
  nomEtab?: string
  adresse?: string
  codePostal?: string
  ville?: string
  siret?: string
  pays?: string
}

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    entreprise: {
      create: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal(
  'readValidatedBody',
  async (
    event: H3Event,
    parse: (body: unknown) => unknown
  ) => parse(event.context.body)
)
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Student, numId: 'o123456789' }
}))

let handler: typeof import('~~/server/api/companies/index.post')['default']

describe('POST /api/companies/', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/companies/index.post')).default
  })

  it('create company', async () => {
    const mockBody: EntrepriseCreateType = {
      nom: 'Mon Entreprise',
      adresse: '1 rue de la République',
      codePostal: '75000',
      ville: 'Paris',
      pays: 'France'
    }

    const mockCreatedResponse = { idEntreprise: 1, ...mockBody }
    vi.mocked(prisma.entreprise.create).mockResolvedValue(mockCreatedResponse as never)

    const event = { context: { body: mockBody } } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.entreprise.create).toHaveBeenCalledTimes(1)
    expect(prisma.entreprise.create).toHaveBeenCalledWith({
      data: {
        nom: mockBody.nom,
        nomEtab: mockBody.nomEtab,
        adresse: mockBody.adresse,
        codePostal: mockBody.codePostal,
        ville: mockBody.ville,
        siret: mockBody.siret,
        pays: mockBody.pays
      }
    })
    expect(response).toEqual(mockCreatedResponse)
  })

  it('reject invalid request', async () => {
    const event = { context: { body: { nom: '' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()

    expect(prisma.entreprise.create).not.toHaveBeenCalled()
  })
})
