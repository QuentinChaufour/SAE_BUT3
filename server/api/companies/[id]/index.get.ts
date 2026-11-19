import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

defineRouteMeta({
  openAPI: {
    tags: ['companies'],
    description: 'Retourner le nom d\'une entreprise par son identifiant.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'L\'identifiant de l\'entreprise à rechercher.',
        required: true,
        schema: { type: 'number' }
      }
    ],
    responses: {
      200: {
        description: 'Le nom de l\'entreprise.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nom: { type: 'string' }
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
  await checkAuth(event, [UserRole.Secretary, UserRole.Teacher])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const company = await prisma.entreprise.findUnique({
    where: { idEntreprise: params.id },
    select: { nom: true }
  })

  if (!company) {
    throw createError({
      statusCode: 404,
      message: 'Entreprise introuvable.'
    })
  }

  return company
})
