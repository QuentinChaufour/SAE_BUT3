import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { Personnel_Role } from '~~/generated/prisma/enums'

const mocks = vi.hoisted(() => ({
  setResponseStatus: vi.fn(),
  tx: {
    personnel: { create: vi.fn() },
    appartenir: { createMany: vi.fn() }
  }
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { $transaction: vi.fn(), personnel: { count: vi.fn() } }
}))

mockNuxtImport('setResponseStatus', () => mocks.setResponseStatus)

vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Admin }
}))
vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('readValidatedBody', async (event: { body?: unknown }, validate: (data: unknown) => unknown) =>
  validate(event.body ?? {})
)

const adminBody = {
  numPersonnel: 'p1234',
  nom: 'Dupont',
  prenom: 'Jean',
  role: Personnel_Role.admin
}

const secretariatBody = {
  numPersonnel: 'p7896',
  nom: 'Martin',
  prenom: 'Lucie',
  role: Personnel_Role.secretariat
}

let handler: typeof import('~~/server/api/personnels/index.post')['default']

function callRoute(body: Record<string, unknown> = {}) {
  return handler({ body } as unknown as H3Event)
}

describe('POST /api/personnels', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    vi.mocked(prisma.$transaction).mockImplementation((async (callback: (tx: typeof mocks.tx) => unknown) => callback(mocks.tx)) as never)
    vi.mocked(prisma.personnel.count).mockResolvedValue(0)

    mocks.tx.personnel.create.mockImplementation(async ({ data }: { data: unknown }) => data)
    mocks.tx.appartenir.createMany.mockResolvedValue({ count: 0 })

    handler = (await import('~~/server/api/personnels/index.post')).default
  })

  it('creates an admin personnel without attachment', async () => {
    const response = await callRoute(adminBody)

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(mocks.tx.personnel.create).toHaveBeenCalledTimes(1)
    expect(mocks.tx.personnel.create).toHaveBeenCalledWith({ data: adminBody })
    expect(mocks.tx.appartenir.createMany).not.toHaveBeenCalled()
    expect(response).toEqual(adminBody)
  })

  it('returns a 201 status', async () => {
    const event = { body: adminBody } as unknown as H3Event
    await handler(event)

    expect(mocks.setResponseStatus).toHaveBeenCalledTimes(1)
    expect(mocks.setResponseStatus).toHaveBeenCalledWith(event, 201)
  })

  it('creates a secretariat personnel without department_ids', async () => {
    const response = await callRoute(secretariatBody)

    expect(mocks.tx.personnel.create).toHaveBeenCalledWith({ data: secretariatBody })
    expect(mocks.tx.appartenir.createMany).not.toHaveBeenCalled()
    expect(response).toEqual(secretariatBody)
  })

  it('does not attach when department_ids is empty', async () => {
    await callRoute({ ...secretariatBody, department_ids: [] })

    expect(mocks.tx.personnel.create).toHaveBeenCalledTimes(1)
    expect(mocks.tx.appartenir.createMany).not.toHaveBeenCalled()
  })

  it('attaches a secretariat personnel to departments', async () => {
    const response = await callRoute({ ...secretariatBody, department_ids: [1, 2] })

    expect(mocks.tx.personnel.create).toHaveBeenCalledWith({ data: secretariatBody })
    expect(mocks.tx.appartenir.createMany).toHaveBeenCalledTimes(1)
    expect(mocks.tx.appartenir.createMany).toHaveBeenCalledWith({
      data: [
        { numPersonnel: secretariatBody.numPersonnel, idDepartement: 1, dateDebut: new Date() },
        { numPersonnel: secretariatBody.numPersonnel, idDepartement: 2, dateDebut: new Date() }
      ]
    })
    expect(response).toEqual(secretariatBody)
  })

  it('does not attach an admin personnel to departments', async () => {
    await callRoute({ ...adminBody, department_ids: [1, 2] })

    expect(mocks.tx.personnel.create).toHaveBeenCalledWith({ data: adminBody })
    expect(mocks.tx.appartenir.createMany).not.toHaveBeenCalled()
  })

  it('rejects an invalid role', async () => {
    await expect(callRoute({ ...adminBody, role: 'student' })).rejects.toThrow()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('return 409 if the personnel number already exists', async () => {
    vi.mocked(prisma.personnel.count).mockResolvedValue(1)

    await expect(callRoute(adminBody)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Ce numéro personnel existe déjà.'
    })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
