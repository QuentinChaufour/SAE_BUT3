import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import type { Personnel } from '~~/generated/prisma/client'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    personnel: {
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

let handler: typeof import('~~/server/api/personnels/[id]/index.patch')['default']

describe('PATCH /api/personnels/[id]', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/personnels/[id]/index.patch')).default
  })

  it('update department successfully with all fields', async () => {
    const mockUpdatedPersonnel: Partial<Personnel> = {
      prenom: 'Timothy',
      nom: 'Cuisine'
    }

    vi.mocked(prisma.personnel.update).mockResolvedValue(mockUpdatedPersonnel as never)

    const event = {
      context: {
        params: { id: 'p123456789' },
        body: { nom: 'Timothy', prenom: 'Cuisine' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.personnel.update).toHaveBeenCalledTimes(1)
    expect(prisma.personnel.update).toHaveBeenCalledWith({
      where: { numPersonnel: 'p123456789' },
      data: { nom: 'Timothy', prenom: 'Cuisine' },
      select: { nom: true, prenom: true }
    })
    expect(response).toEqual(mockUpdatedPersonnel)
  })

  it('update department successfully with only one field (nom)', async () => {
    const mockUpdatedDepartement: Partial<Personnel> = {
      prenom: 'Timothy'
    }

    vi.mocked(prisma.personnel.update).mockResolvedValue(mockUpdatedDepartement as never)

    const event = {
      context: {
        params: { id: 'p123456789' },
        body: { nom: 'Timothy' }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.personnel.update).toHaveBeenCalledTimes(1)
    expect(prisma.personnel.update).toHaveBeenCalledWith({
      where: { numPersonnel: 'p123456789' },
      data: { nom: 'Timothy' },
      select: { nom: true, prenom: true }
    })
    expect(response).toEqual(mockUpdatedDepartement)
  })

  it('reject request if no fields are provided in the body', async () => {
    const event = { context: { params: { id: 'p123456789' }, body: {} } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.personnel.update).not.toHaveBeenCalled()
  })

  it('reject request if invalid params id', async () => {
    const event = { context: { params: { id: 'o123456789' }, body: { prenom: 'John' } } } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.personnel.update).not.toHaveBeenCalled()
  })
})
