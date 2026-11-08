import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    $transaction: vi.fn()
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
  'createError',
  (error: { statusCode: number, message: string }) => {
    const result = new Error(error.message)
    Object.assign(result, error)
    return result
  }
)
vi.stubGlobal(
  'sendError',
  (_event: H3Event, error: Error) => ({
    statusCode: (error as Error & { statusCode: number }).statusCode,
    error
  })
)

const numEtu = 'o123456789'

let handler: typeof import('~~/server/api/students/[numEtu]/dossier/[dossierId]/contacts/[contactId]/index.delete')['default']

const contactId = '4'

describe('DELETE /api/contacts/:contactId', () => {
  const transaction = {
    demarcheRechercheContact: {
      deleteMany: vi.fn()
    },
    demarcheContact: {
      delete: vi.fn()
    }
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/dossier/[dossierId]/contacts/[contactId]/index.delete'
    )).default
    vi.mocked(prisma.$transaction).mockImplementation(
      async callback => callback(transaction as never)
    )
  })

  it('delete a contact and its dossier associations', async () => {
    const deletedContact = {
      idContact: 4,
      nom: 'Durand',
      prenom: 'Alice'
    }
    vi.mocked(transaction.demarcheContact.delete).mockResolvedValue(
      deletedContact as never
    )

    const event = {
      context: {
        params: { numEtu, contactId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(transaction.demarcheRechercheContact.deleteMany).toHaveBeenCalledWith({
      where: { idContact: 4 }
    })
    expect(transaction.demarcheContact.delete).toHaveBeenCalledWith({
      where: { idContact: 4 }
    })
    expect(response).toEqual({ statusCode: 204 })
  })

  it('return not found when the contact does not exist', async () => {
    vi.mocked(transaction.demarcheContact.delete).mockResolvedValue(null as never)

    const event = {
      context: {
        params: { numEtu, contactId }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(response).toMatchObject({ statusCode: 404 })
    expect((response as unknown as { error: Error }).error.message).toBe('Contact not found')
  })

  it('reject request if the contact ID is invalid', async () => {
    const event = {
      context: {
        params: { numEtu, contactId: 'invalid' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
