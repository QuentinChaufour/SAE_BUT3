import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive('L\'identifiant du département doit être un nombre entier positif.')
})

defineRouteMeta({
  openAPI: {
    tags: ['departments'],
    description: 'Obtenir les informations sur d\'un département.',
    responses: {
      200: {
        description: 'Les informations sur le département.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                idDepartement: { type: 'number' },
                nom: { type: 'string' },
                annee: { type: 'string' },
                DepartementTag: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      idTag: { type: 'number' },
                      nomTag: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      403: {
        description: 'Forbidden'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const department = await prisma.departement.findUnique({
    where: { idDepartement: params.id },
    select: {
      idDepartement: true,
      nom: true,
      anneeActuelle: true,
      DepartementTag: {
        select: {
          idTag: true,
          nomTag: true
        }
      }
    }
  })
  return department
})
