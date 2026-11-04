import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'
import { Personnel_Role } from '~~/generated/prisma/enums'
import UserRole from '~~/shared/types/role'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: { personnel: { findUnique: vi.fn() } }
}))

vi.stubGlobal('requireUserSession', async () => ({
  user: { role: UserRole.Admin, numId: 'p123456789' }
}))

vi.stubGlobal(
  'createError',
  (error: { statusCode: number, statusMessage: string }) =>
    Object.assign(new Error(error.statusMessage), error)
)

vi.stubGlobal('defineRouteMeta', () => {})
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getValidatedRouterParams', async (event: { params?: unknown }, validate: (data: unknown) => unknown) =>
  validate(event.params ?? {})
)

const mockPersonnel = {
  numPersonnel: 'p7654321',
  nom: 'Martin',
  prenom: 'Claire',
  role: Personnel_Role.secretariat,
  Appartenir: [
    {
      idAppartenance: 1,
      dateDebut: new Date('2026-09-01T00:00:00.000Z'),
      dateFin: null,
      Departement: { idDepartement: 1, nom: 'Informatique' }
    }
  ]
}

const expectedArgs = {
  where: { numPersonnel: 'p1234' },
  select: {
    numPersonnel: true,
    nom: true,
    prenom: true,
    role: true,
    Appartenir: {
      select: {
        idAppartenance: true,
        dateDebut: true,
        dateFin: true,
        Departement: {
          select: {
            idDepartement: true,
            nom: true
          }
        }
      }
    }
  }
}

let handler: typeof import('~~/server/api/personnels/[id]/index.get')['default']

describe('GET /api/personnels/:id', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.personnel.findUnique).mockResolvedValue(mockPersonnel as never)

    handler = (await import('~~/server/api/personnels/[id]/index.get')).default
  })

  it('gets the personnel with his departments', async () => {
    const response = await handler({ params: { id: 'p1234' } } as unknown as H3Event)

    expect(prisma.personnel.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.personnel.findUnique).toHaveBeenCalledWith(expectedArgs)
    expect(response).toEqual(mockPersonnel)
  })

  it('gets a personnel without any department', async () => {
    const withoutDepartment = { ...mockPersonnel, Appartenir: [] }
    vi.mocked(prisma.personnel.findUnique).mockResolvedValueOnce(withoutDepartment as never)

    const response = await handler({ params: { id: 'p1234' } } as unknown as H3Event)
    expect(response).toEqual(withoutDepartment)
  })

  it('throws a 404 when the personnel does not exist', async () => {
    vi.mocked(prisma.personnel.findUnique).mockResolvedValueOnce(null as never)
    await expect(handler({ params: { id: 'p1234' } } as unknown as H3Event)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Personnel non trouvé.'
    })
  })
})
