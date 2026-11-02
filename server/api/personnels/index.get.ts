import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod'
import { Personnel_Role } from '~~/generated/prisma/enums'
import type { PersonnelWhereInput } from '~~/generated/prisma/models'

const querySchema = z.object({
  department_id: z.coerce.number().int().positive().optional(),
  role: z.enum(Personnel_Role).optional()
})

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Obtenir la liste des personnels.',
    parameters: [
      {
        name: 'department_id',
        in: 'query',
        description: 'Filtrer les personnels rattachés à un département spécifique.',
        required: false,
        schema: { type: 'number' }
      },
      {
        name: 'role',
        in: 'query',
        description: 'Filtrer les personnels par rôle (admin ou secrétariat).',
        required: false,
        schema: { type: 'string', enum: ['admin', 'secretariat'] }
      }
    ],
    responses: {
      200: {
        description: 'La liste des personnels.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  numPersonnel: { type: 'string' },
                  nom: { type: 'string' },
                  prenom: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'secretariat'] }
                }
              }
            }
          }
        }
      },
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const query = await getValidatedQuery(event, querySchema.parse)

  const where: PersonnelWhereInput = {}
  if (query.role) where['role'] = query.role
  if (query.department_id) {
    where['Appartenir'] = {
      some: {
        idDepartement: query.department_id,
        dateDebut: { lte: new Date() },
        OR: [
          { dateFin: { gt: new Date() } },
          { dateFin: null }
        ]
      }
    }
  }

  const personnels = await prisma.personnel.findMany({
    where,
    select: {
      numPersonnel: true,
      nom: true,
      prenom: true,
      role: true
    },
    orderBy: { numPersonnel: 'asc' }
  })
  return personnels
})
