import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    demarcheContact: {
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

let handler: typeof import('~~/server/api/dossier/[dossierId]/contacts/index.get')['default']

const dossierId = '12'

describe('GET /api/dossier/:dossierId/contacts', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/dossier/[dossierId]/contacts/index.get'
    )).default
  })

  it('return the contacts of a dossier', async () => {
    const contacts = [
      {
        idContact: 4,
        nom: 'Durand',
        prenom: 'Alice',
        email: 'alice@example.com'
      }
    ]

    vi.mocked(prisma.demarcheContact.findMany).mockResolvedValue(contacts as never)

    const event = {
      context: {
        params: { dossierId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.demarcheContact.findMany).toHaveBeenCalledWith({
      where: { idRecherche: 12 }
    })
    expect(response).toEqual({
      statusCode: 200,
      data: contacts
    })
  })

  it('return not found when contacts are unavailable', async () => {
    vi.mocked(prisma.demarcheContact.findMany).mockResolvedValue(null as never)

    const event = {
      context: {
        params: { dossierId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toEqual({
      statusCode: 404,
      data: null
    })
  })

  it('reject request if the dossier ID is invalid', async () => {
    const event = {
      context: {
        params: { dossierId: 'invalid' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheContact.findMany).not.toHaveBeenCalled()
  })
})
