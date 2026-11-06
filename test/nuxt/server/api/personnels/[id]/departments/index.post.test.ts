import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import { Personnel_Role } from '~~/generated/prisma/enums'

const mocks = vi.hoisted(() => ({
  setResponseStatus: vi.fn(),
  createError: vi.fn((options: { statusCode: number, message: string }) =>
    Object.assign(new Error(options.message), options)
  )
}))

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    personnel: { findUnique: vi.fn() },
    appartenir: {
      findFirst: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('~~/server/utils/middleware', () => ({
  checkAuth: vi.fn()
}))

mockNuxtImport('setResponseStatus', () => mocks.setResponseStatus)
mockNuxtImport('createError', () => mocks.createError)

vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getValidatedRouterParams', async (event: { params?: unknown }, validate: (data: unknown) => unknown) =>
  validate(event.params ?? {})
)
vi.stubGlobal('readValidatedBody', async (event: { body?: unknown }, validate: (data: unknown) => unknown) =>
  validate(event.body ?? {})
)

const NOW = new Date('2026-11-01T10:00:00.000Z')

const validParams = { id: 'p123456789' }
const validBody = { departement_id: 3 }

const mockPersonnel = {
  numPersonnel: 'p123456789',
  nom: 'Martin',
  prenom: 'Claire',
  role: Personnel_Role.secretariat
}

const createdAppartenance = {
  idAppartenance: 42,
  numPersonnel: 'p123456789',
  idDepartement: 3,
  dateDebut: NOW,
  dateFin: null
}

let handler: typeof import('~~/server/api/personnels/[id]/departments/index.post')['default']

function callHandler(params: Record<string, unknown> = validParams, body: Record<string, unknown> = validBody) {
  return handler({ params, body } as unknown as H3Event)
}

describe('POST /api/personnels/:id/departments', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.setSystemTime(NOW)

    vi.mocked(prisma.personnel.findUnique).mockResolvedValue(mockPersonnel as never)
    vi.mocked(prisma.appartenir.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.appartenir.create).mockResolvedValue(createdAppartenance as never)

    handler = (await import('~~/server/api/personnels/[id]/departments/index.post')).default
  })

  it('checks that the personnel exists', async () => {
    await callHandler()

    expect(prisma.personnel.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.personnel.findUnique).toHaveBeenCalledWith({
      where: { numPersonnel: 'p123456789' }
    })
  })

  it('creates attachment', async () => {
    const response = await callHandler()

    expect(prisma.appartenir.create).toHaveBeenCalledTimes(1)
    expect(prisma.appartenir.create).toHaveBeenCalledWith({
      data: {
        numPersonnel: 'p123456789',
        idDepartement: 3,
        dateDebut: NOW
      }
    })
    expect(response).toEqual(createdAppartenance)
    expect(mocks.createError).not.toHaveBeenCalled()
  })

  it('return 404 when the personnel does not exist', async () => {
    vi.mocked(prisma.personnel.findUnique).mockResolvedValueOnce(null as never)

    await expect(callHandler()).rejects.toMatchObject({
      statusCode: 404,
      message: 'Personnel non trouvé.'
    })

    expect(prisma.appartenir.findFirst).not.toHaveBeenCalled()
    expect(prisma.appartenir.create).not.toHaveBeenCalled()
    expect(mocks.setResponseStatus).not.toHaveBeenCalled()
  })

  it('return 400 when the personnel is already attached to the department', async () => {
    vi.mocked(prisma.appartenir.findFirst).mockResolvedValueOnce({ idAppartenance: 7 } as never)

    await expect(callHandler()).rejects.toMatchObject({
      statusCode: 400,
      message: 'Le personnel est déjà rattaché à ce département.'
    })

    expect(prisma.appartenir.create).not.toHaveBeenCalled()
    expect(mocks.setResponseStatus).not.toHaveBeenCalled()
  })

  it('return error if the personnel is not a secretariat', async () => {
    vi.mocked(prisma.personnel.findUnique).mockResolvedValueOnce({
      ...mockPersonnel,
      role: Personnel_Role.admin
    } as never)

    await expect(callHandler()).rejects.toMatchObject({
      statusCode: 400,
      message: 'Seul le secrétariat peut être rattaché à un département.'
    })

    expect(prisma.appartenir.findFirst).not.toHaveBeenCalled()
    expect(prisma.appartenir.create).not.toHaveBeenCalled()
    expect(mocks.setResponseStatus).not.toHaveBeenCalled()
  })
})
