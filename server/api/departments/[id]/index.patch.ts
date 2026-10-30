import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'
import { yearSchema } from '~~/shared/schemas/year'
import { nomDepartementSchema } from '~~/shared/schemas/department'

const bodySchema = z.object({
  nom: nomDepartementSchema.optional(),
  annee: yearSchema.optional()
})

const paramsSchema = z.object({
  id: z.coerce.number().int().positive('L\'identifiant du département doit être un nombre entier positif.')
})

defineRouteMeta({
  openAPI: {
    tags: ['departments'],
    description: 'Modifier un département existant.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              nom: {
                type: 'string',
                description: 'Nom du département'
              },
              annee: {
                type: 'string',
                description: 'Année universitaire du département'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Le département modifié.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                idDepartement: { type: 'number' },
                nom: { type: 'string' },
                annee: { type: 'string' }
              }
            }
          }
        }
      },
      400: {
        description: 'Les paramètres ou les données fournies sont invalides.'
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
  const body = await readValidatedBody(event, bodySchema.parse)

  const updatedData = {
    ...(body.nom && { nom: body.nom }),
    ...(body.annee && { anneeActuelle: body.annee })
  }

  if (Object.keys(updatedData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one field must be provided.'
    })
  }

  const updated = await prisma.departement.update({
    where: { idDepartement: params.id },
    data: updatedData
  })

  return updated
})
