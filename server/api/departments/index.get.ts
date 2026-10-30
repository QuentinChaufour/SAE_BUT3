import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

defineRouteMeta({
  openAPI: {
    tags: ['departments'],
    description: 'Obtenir la liste des départements.',
    responses: {
      200: {
        description: 'La liste des départements.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idDepartement: { type: 'number' },
                  nom: { type: 'string' }
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

  const departments = await prisma.departement.findMany({
    select: {
      idDepartement: true,
      nom: true
    },
    orderBy: { idDepartement: 'desc' }
  })
  return departments
})
