import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

import { prisma } from '~~/server/utils/prisma'

vi.mock('~~/server/utils/prisma', () => ({
  prisma: {
    etudiant: {
      findFirst: vi.fn()
    },
    departement: {
      findUnique: vi.fn()
    }
  }
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)

let handler: typeof import('~~/server/api/students/[numEtu]/departement/index.get')['default']

const numEtu = 'o123456789'

describe('GET /api/students/:numEtu/departement', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    handler = (await import(
      '~~/server/api/students/[numEtu]/departement/index.get'
    )).default
  })

  it('return the department of a student', async () => {
    const department = {
      idDepartement: 1,
      nomDepartement: 'Informatique'
    }

    vi.mocked(prisma.etudiant.findFirst).mockResolvedValue({
      Inscription: [
        {
          Formation: {
            idDepartement: department.idDepartement
          }
        }
      ]
    } as never)
    vi.mocked(prisma.departement.findUnique).mockResolvedValue(department as never)

    const event = {
      context: {
        params: { numEtu }
      }
    } as unknown as H3Event

    const response = await handler(event)

    expect(prisma.etudiant.findFirst).toHaveBeenCalledWith({
      where: { numEtu },
      select: {
        Inscription: {
          select: {
            Formation: {
              select: {
                idDepartement: true
              }
            }
          }
        }
      }
    })
    expect(prisma.departement.findUnique).toHaveBeenCalledWith({
      where: { idDepartement: department.idDepartement }
    })
    expect(response).toEqual({
      statusCode: 200,
      data: department
    })
  })

  it.each([
    ['student not found', null],
    ['student has no enrollment', { Inscription: [] }]
  ])('return not found when %s', async (_case, student) => {
    vi.mocked(prisma.etudiant.findFirst).mockResolvedValue(student as never)

    const event = {
      context: {
        params: { numEtu }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.departement.findUnique).not.toHaveBeenCalled()
  })

  it('reject request if the student ID is invalid', async () => {
    const event = {
      context: {
        params: { numEtu: 'INVALID_ID_xxxxxxxxxxx' }
      }
    } as unknown as H3Event

    await expect(handler(event)).rejects.toThrow()
    expect(prisma.etudiant.findFirst).not.toHaveBeenCalled()
  })
})