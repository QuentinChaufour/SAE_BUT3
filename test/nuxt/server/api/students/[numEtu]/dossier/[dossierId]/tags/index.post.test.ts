import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    departementTag: {
      findFirst: vi.fn()
    },
    departementTagRecherche: {
      create: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Student, numId: 'o123456789' }
}))

vi.stubGlobal(
  'getValidatedRouterParams',
  async (
    event: H3Event,
    parse: (params: unknown) => unknown
  ) => parse(event.context.params)
)
vi.stubGlobal(
  'readValidatedBody',
  async (
    event: H3Event,
    parse: (body: unknown) => unknown
  ) => parse(event.context.body)
)
vi.stubGlobal(
  'createError',
  (error: { statusCode: number, message: string }) => {
    const result = new Error(error.message)
    Object.assign(result, error)
    return result
  }
)

let handler: typeof import('~~/server/api/students/[numEtu]/dossier/[dossierId]/tags/index.post')['default']

const numEtu = 'o123456789'
const dossierId = '12'
const tag = 'JavaScript'

describe('POST /api/students/[numEtu]/dossier/:dossierId/tags', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/dossier/[dossierId]/tags/index.post'
    )).default
  })

  it('add a tag to a dossier', async () => {
    vi.mocked(prisma.departementTag.findFirst).mockResolvedValue({
      idTag: 4
    } as never)
    vi.mocked(prisma.departementTagRecherche.create).mockResolvedValue({
      idRecherche: 12,
      idTag: 4
    } as never)

    const event = {
      context: {
        params: { numEtu, dossierId },
        body: { tag }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.departementTag.findFirst).toHaveBeenCalledWith({
      where: { nomTag: tag },
      select: { idTag: true }
    })
    expect(prisma.departementTagRecherche.create).toHaveBeenCalledWith({
      data: {
        idRecherche: 12,
        idTag: 4
      }
    })
    expect(response).toEqual({
      statusCode: 200,
      message: `Tag : ${tag} Added successfully`
    })
  })

  it('return not found when the tag does not exist', async () => {
    vi.mocked(prisma.departementTag.findFirst).mockResolvedValue(null)

    const event = {
      context: {
        params: { numEtu, dossierId },
        body: { tag }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow(`Tag: ${tag} not found`)
    expect(prisma.departementTagRecherche.create).not.toHaveBeenCalled()
  })

  it('return not found when the tag association cannot be created', async () => {
    vi.mocked(prisma.departementTag.findFirst).mockResolvedValue({
      idTag: 4
    } as never)
    vi.mocked(prisma.departementTagRecherche.create).mockRejectedValue(new Error('Association failed'))

    const event = {
      context: {
        params: { numEtu, dossierId },
        body: { tag }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow(`Tag: ${tag} not found`)
  })

  it('reject request if the dossier ID is invalid', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId: 'invalid' },
        body: { tag }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departementTag.findFirst).not.toHaveBeenCalled()
  })

  it('reject request if the tag is missing', async () => {
    const event = {
      context: {
        params: { numEtu, dossierId },
        body: {}
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departementTag.findFirst).not.toHaveBeenCalled()
  })
})
