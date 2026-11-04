import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'
import { prisma } from '~~/server/utils/prisma'

const mocks = vi.hoisted(() => ({
  createError: vi.fn((options: { statusCode: number, message: string }) =>
    Object.assign(new Error(options.message), options)
  )
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      const tx = {
        personnel: { delete: vi.fn() },
        appartenir: { deleteMany: vi.fn() }
      }
      return callback(tx)
    }),
    personnel: { count: vi.fn() }
  }
}))

vi.mock('~~/server/utils/middleware', () => ({
  checkAuth: vi.fn()
}))

mockNuxtImport('createError', () => mocks.createError)

vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('sendNoContent', (_event: H3Event) => ({ status: 204 }))
vi.stubGlobal(
  'getValidatedRouterParams',
  async (event: H3Event, parse: (params: unknown) => unknown) => parse(event.context.params)
)

const validParams = { id: 'p123456' }

let handler: typeof import('~~/server/api/personnels/[id]/index.delete')['default']

describe('DELETE /api/personnels/:id', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.personnel.count).mockResolvedValue(1)

    handler = (await import('~~/server/api/personnels/[id]/index.delete')).default
  })

  it('delete department and associated data successfully', async () => {
    const response = await handler({ context: { params: { id: 'p1234' } } } as unknown as H3Event)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(response).toEqual({ status: 204 })
  })

  it('return 404 if personnel not found', async () => {
    vi.mocked(prisma.personnel.count).mockResolvedValue(0)
    await expect(handler({ context: { params: { id: 'p1234' } } } as unknown as H3Event)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Personnel non trouvé.'
    })
  })

  it.each(['', 'abc', '123', '1234p'])('rejects an invalid id', async (id) => {
    await expect(handler({ params: { ...validParams, id } } as unknown as H3Event)).rejects.toThrow()
    expect(prisma.personnel.count).not.toHaveBeenCalled()
  })
})
