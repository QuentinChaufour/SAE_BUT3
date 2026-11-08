import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    anneeUniversitaire: { upsert: vi.fn() },
    departement: { create: vi.fn() }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal(
  'readValidatedBody',
  async (event: H3Event, parse: (body: unknown) => unknown) => parse(event.context.body)
)
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Admin, numId: 'p123456789' }
}))

let handler: typeof import('~~/server/api/departments/index.post')['default']

describe('POST /api/departments', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/departments/index.post')).default
  })

  it('create a new department', async () => {
    vi.setSystemTime(new Date('2026-09-30'))

    const validBody = { nom: 'Développement' }

    const mockCreatedRecord = { idDepartement: 1, nom: validBody.nom, anneeActuelle: '2026-2027' }
    const mockUpsertYear = { annee: '2026-2027' }

    vi.mocked(prisma.departement.create).mockResolvedValue(mockCreatedRecord as never)
    vi.mocked(prisma.anneeUniversitaire.upsert).mockResolvedValue(mockUpsertYear as never)

    const event = { context: { body: validBody } } as unknown as H3Event
    const response = await handler(event)

    expect(prisma.departement.create).toHaveBeenCalledTimes(1)
    expect(prisma.departement.create).toHaveBeenCalledWith({
      data: {
        nom: validBody.nom,
        anneeActuelle: '2026-2027'
      }
    })
    expect(response).toEqual(mockCreatedRecord)
  })

  it('reject request if invalid body', async () => {
    const invalidBody = { nom: '' }
    const event = { context: { body: invalidBody } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departement.create).not.toHaveBeenCalled()
  })
})
