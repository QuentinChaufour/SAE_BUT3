import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod'
import { numPersonnelSchema, personnelUpdateBodySchema } from '~~/shared/schemas/personnel'

const paramsSchema = z.object({ id: numPersonnelSchema })

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Modifier les informations d\'un personnel spécifique.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              nom: { type: 'string', description: 'Nom du personnel' },
              prenom: { type: 'string', description: 'Prénom du personnel' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Les informations du personnel.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                prenom: { type: 'string' }
              }
            }
          }
        }
      },
      403: { description: 'Forbidden' },
      404: { description: 'Personnel non trouvé.' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, personnelUpdateBodySchema.parse)

  if (Object.keys(body).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No fields provided for update.'
    })
  }

  const personnel = await prisma.personnel.update({
    select: { nom: true, prenom: true },
    where: { numPersonnel: params.id },
    data: body
  })
  return personnel
})
