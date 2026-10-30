import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import type { Departement } from '~~/generated/prisma/client'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    departement: {
      update: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('defineRouteMeta', () => {})

vi.stubGlobal(
  'readValidatedBody',
  async (event: H3Event, parse: (body: unknown) => unknown) => parse(event.context.body)
)

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

let handler: typeof import('~~/server/api/departments/[id]/index.patch')['default']

describe('PATCH /api/departments/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/departments/[id]/index.patch')).default
  })

  it('update department successfully with all fields', async () => {
    const mockUpdatedDepartement: Partial<Departement> = {
      idDepartement: 1,
      nom: 'Informatique Modifié',
      anneeActuelle: '2026-2027'
    }

    vi.mocked(prisma.departement.update).mockResolvedValue(mockUpdatedDepartement as never)

    const event = {
      context: {
        params: { id: 1 },
        body: { nom: 'Informatique Modifié', annee: '2026-2027' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.departement.update).toHaveBeenCalledTimes(1)
    expect(prisma.departement.update).toHaveBeenCalledWith({
      where: { idDepartement: 1 },
      data: {
        nom: 'Informatique Modifié',
        anneeActuelle: '2026-2027'
      }
    })
    expect(response).toEqual(mockUpdatedDepartement)
  })

  it('update department successfully with only one field (nom)', async () => {
    const mockUpdatedDepartement: Partial<Departement> = {
      idDepartement: 1,
      nom: 'Informatique Modifié',
      anneeActuelle: '2026-2027'
    }

    vi.mocked(prisma.departement.update).mockResolvedValue(mockUpdatedDepartement as never)

    const event = {
      context: {
        params: { id: 1 },
        body: { nom: 'Informatique Modifié' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.departement.update).toHaveBeenCalledTimes(1)
    expect(prisma.departement.update).toHaveBeenCalledWith({
      where: { idDepartement: 1 },
      data: {
        nom: 'Informatique Modifié'
      }
    })
    expect(response).toEqual(mockUpdatedDepartement)
  })

  it('reject request if no fields are provided in the body', async () => {
    const event = { context: { params: { id: 1 }, body: {} } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departement.update).not.toHaveBeenCalled()
  })

  it('reject request if invalid params id', async () => {
    const event = { context: { params: { id: -5 }, body: { nom: 'Informatique' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departement.update).not.toHaveBeenCalled()
  })
})
