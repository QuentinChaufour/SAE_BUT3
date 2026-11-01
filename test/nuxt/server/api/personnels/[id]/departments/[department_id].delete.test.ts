import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'

const mocks = vi.hoisted(() => ({
  sendNoContent: vi.fn(),
  createError: vi.fn((options: { statusCode: number, message: string }) =>
    Object.assign(new Error(options.message), options)
  )
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    appartenir: {
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock('~~/server/utils/middleware', () => ({
  checkAuth: vi.fn()
}))

mockNuxtImport('createError', () => mocks.createError)

vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('sendNoContent', mocks.sendNoContent)
vi.stubGlobal('getValidatedRouterParams', async (event: { params?: unknown }, validate: (data: unknown) => unknown) =>
  validate(event.params ?? {})
)

const NOW = new Date('2026-11-01T10:00:00.000Z')

const validParams = { id: 'p000000001', departement_id: '3' }
const mockAppartenance = { idAppartenance: 42, numPersonnel: 'p000000001', idDepartement: 3, dateFin: null }

let handler: typeof import('~~/server/api/personnels/[id]/departments/[department_id].delete')['default']

describe('DELETE /api/personnels/:id/departments/:department_id', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.setSystemTime(NOW)

    vi.mocked(prisma.appartenir.findFirst).mockResolvedValue(mockAppartenance as never)
    vi.mocked(prisma.appartenir.update).mockResolvedValue({} as never)
    mocks.sendNoContent.mockReturnValue(undefined)

    handler = (await import('~~/server/api/personnels/[id]/departments/[department_id].delete')).default
  })

  it('looks for the active attachment (coercing departement_id)', async () => {
    await handler({ params: validParams } as unknown as H3Event)

    expect(prisma.appartenir.findFirst).toHaveBeenCalledTimes(1)
    expect(prisma.appartenir.findFirst).toHaveBeenCalledWith({
      where: {
        numPersonnel: 'p000000001',
        idDepartement: 3,
        dateFin: null
      }
    })
  })

  it('ends the attachment by setting dateFin', async () => {
    await handler({ params: validParams } as unknown as H3Event)

    expect(prisma.appartenir.update).toHaveBeenCalledTimes(1)
    expect(prisma.appartenir.update).toHaveBeenCalledWith({
      where: { idAppartenance: 42 },
      data: { dateFin: NOW }
    })
  })

  it('returns no content on success', async () => {
    const event = { params: validParams } as unknown as H3Event
    await handler(event)

    expect(mocks.sendNoContent).toHaveBeenCalledTimes(1)
    expect(mocks.sendNoContent).toHaveBeenCalledWith(event)
    expect(mocks.createError).not.toHaveBeenCalled()
  })

  it('return 404 if no active attachment exists', async () => {
    vi.mocked(prisma.appartenir.findFirst).mockResolvedValueOnce(null as never)

    await expect(handler({ params: validParams } as unknown as H3Event)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Rattachement non trouvé.'
    })
    expect(mocks.createError).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Rattachement non trouvé.'
    })
    expect(prisma.appartenir.update).not.toHaveBeenCalled()
    expect(mocks.sendNoContent).not.toHaveBeenCalled()
  })

  it.each(['', 'abc', '123'])('rejects an invalid id', async (id) => {
    await expect(handler({ params: { ...validParams, id } } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.appartenir.findFirst).not.toHaveBeenCalled()
  })

  it.each(['0', '-1', '1.5', 'abc'])('rejects an invalid departement_id', async (departementId) => {
    await expect(handler({ params: { ...validParams, departement_id: departementId } } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.appartenir.findFirst).not.toHaveBeenCalled()
  })
})
