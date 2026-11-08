import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    departementTag: {
      findMany: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal(
  'getValidatedRouterParams',
  async (
    event: H3Event,
    parse: (params: unknown) => unknown
  ) => parse(event.context.params)
)

let handler: typeof import('~~/server/api/departments/[id]/tags/index.get')['default']

const departementId = '3'

describe('GET /api/departments/:departementId/tags', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/departments/[id]/tags/index.get'
    )).default
  })

  it('return the tags of a department', async () => {
    const tags = [
      { nomTag: 'JavaScript' },
      { nomTag: 'TypeScript' }
    ]

    vi.mocked(prisma.departementTag.findMany).mockResolvedValue(tags as never)

    const event = {
      context: {
        params: { id: departementId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.departementTag.findMany).toHaveBeenCalledWith({
      where: { idDepartement: 3 },
      select: { nomTag: true }
    })
    expect(response).toEqual({
      statusCode: 200,
      data: tags
    })
  })

  it('return an empty list when the department has no tags', async () => {
    vi.mocked(prisma.departementTag.findMany).mockResolvedValue([])

    const event = {
      context: {
        params: { id: departementId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toEqual({
      statusCode: 200,
      data: []
    })
  })

  it('reject request if the department ID is invalid', async () => {
    const event = {
      context: {
        params: { id: 'invalid' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departementTag.findMany).not.toHaveBeenCalled()
  })
})
