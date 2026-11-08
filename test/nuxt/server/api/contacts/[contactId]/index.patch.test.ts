import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    demarcheContact: {
      update: vi.fn()
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

let handler: typeof import('~~/server/api/contacts/[contactId]/index.patch')['default']

const contactId = '4'

describe('PATCH /api/contacts/:contactId', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import('~~/server/api/contacts/[contactId]/index.patch')).default
  })

  it('update a contact', async () => {
    const body = {
      fonction: 'Responsable RH'
    }
    const updatedContact = {
      idContact: 4,
      nom: 'Durand',
      prenom: 'Alice',
      ...body,
      idRecherche: 12
    }

    vi.mocked(prisma.demarcheContact.update).mockResolvedValue(updatedContact as never)

    const event = {
      context: {
        params: { contactId },
        body
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.demarcheContact.update).toHaveBeenCalledWith({
      where: { idContact: 4 },
      data: body
    })
    expect(response).toEqual({
      statusCode: 200,
      data: updatedContact
    })
  })

  it('allow updating several contact fields', async () => {
    const body = {
      nom: 'Martin',
      prenom: 'Bob',
      email: 'bob@example.com',
      telephone: '+33123456789',
      fonction: 'Manager',
      idRecherche: 15
    }
    vi.mocked(prisma.demarcheContact.update).mockResolvedValue({
      idContact: 4,
      ...body
    } as never)

    const event = {
      context: {
        params: { contactId },
        body
      }
    } as unknown as H3Event

    await handler(event)

    expect(prisma.demarcheContact.update).toHaveBeenCalledWith({
      where: { idContact: 4 },
      data: body
    })
  })

  it('reject request if the contact ID is invalid', async () => {
    const event = {
      context: {
        params: { contactId: 'invalid' },
        body: { fonction: 'Manager' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheContact.update).not.toHaveBeenCalled()
  })

  it('reject request if the contact body is invalid', async () => {
    const event = {
      context: {
        params: { contactId },
        body: { email: 'invalid-email' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.demarcheContact.update).not.toHaveBeenCalled()
  })
})
