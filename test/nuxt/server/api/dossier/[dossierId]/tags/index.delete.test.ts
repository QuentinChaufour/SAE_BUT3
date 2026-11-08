import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    departementTagRecherche: {
      findFirst: vi.fn(),
      delete: vi.fn()
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

let handler: typeof import('~~/server/api/dossier/[dossierId]/tags/index.delete')['default']

const dossierId = '12'
const tag = 'JavaScript'

describe('DELETE /api/dossier/:dossierId/tags', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/dossier/[dossierId]/tags/index.delete'
    )).default
  })

  it('delete a tag from a dossier', async () => {
    vi.mocked(prisma.departementTagRecherche.findFirst).mockResolvedValue({
      idTag: 4
    } as never)
    vi.mocked(prisma.departementTagRecherche.delete).mockResolvedValue({
      idRecherche: 12,
      idTag: 4
    } as never)

    const event = {
      context: {
        params: { dossierId },
        body: { tag }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.departementTagRecherche.findFirst).toHaveBeenCalledWith({
      where: {
        idRecherche: 12,
        DepartementTag: {
          nomTag: tag
        }
      },
      select: {
        idTag: true
      }
    })
    expect(prisma.departementTagRecherche.delete).toHaveBeenCalledWith({
      where: {
        idRecherche_idTag: {
          idRecherche: 12,
          idTag: 4
        }
      }
    })
    expect(response).toEqual({
      statusCode: 200,
      message: `Tag : ${tag} deleted successfully`
    })
  })

  it('return not found when the tag is not associated with the dossier', async () => {
    vi.mocked(prisma.departementTagRecherche.findFirst).mockResolvedValue(null)

    const event = {
      context: {
        params: { dossierId },
        body: { tag }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow(`Tag: ${tag} not found`)
    expect(prisma.departementTagRecherche.delete).not.toHaveBeenCalled()
  })

  it('return not found when deleting the tag fails', async () => {
    vi.mocked(prisma.departementTagRecherche.findFirst).mockResolvedValue({
      idTag: 4
    } as never)
    vi.mocked(prisma.departementTagRecherche.delete).mockRejectedValue(new Error('Delete failed'))

    const event = {
      context: {
        params: { dossierId },
        body: { tag }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow(`Tag: ${tag} not found`)
  })

  it('reject request if the dossier ID is invalid', async () => {
    const event = {
      context: {
        params: { dossierId: 'invalid' },
        body: { tag }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departementTagRecherche.findFirst).not.toHaveBeenCalled()
  })

  it('reject request if the tag is missing', async () => {
    const event = {
      context: {
        params: { dossierId },
        body: {}
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departementTagRecherche.findFirst).not.toHaveBeenCalled()
  })
})