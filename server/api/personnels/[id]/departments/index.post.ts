import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod'
import { numPersonnelSchema } from '~~/shared/schemas/personnel'

const paramsSchema = z.object({
  id: numPersonnelSchema
})

const bodySchema = z.object({
  departement_id: z.number().int().positive('L\'identifiant du département doit être un nombre entier positif.')
})

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Ajouter un département à un personnel existant.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['departement_id'],
            properties: {
              departement_id: {
                type: 'number',
                description: 'Identifiant du département à rattacher'
              }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Le rattachement créé.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                idAppartenance: { type: 'number' },
                numPersonnel: { type: 'string' },
                idDepartement: { type: 'number' },
                dateDebut: { type: 'string' },
                dateFin: { type: 'string', nullable: true }
              }
            }
          }
        }
      },
      400: { description: 'Les données fournies sont invalides.' },
      403: { description: 'Forbidden' },
      404: { description: 'Personnel non trouvé.' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  const personnel = await prisma.personnel.findUnique({
    where: { numPersonnel: params.id }
  })

  if (!personnel) {
    throw createError({
      statusCode: 404,
      message: 'Personnel non trouvé.'
    })
  }

  const existingAppartenance = await prisma.appartenir.findFirst({
    where: {
      numPersonnel: params.id,
      idDepartement: body.departement_id,
      dateFin: null
    }
  })

  if (existingAppartenance) {
    throw createError({
      statusCode: 400,
      message: 'Le personnel est déjà rattaché à ce département.'
    })
  }

  const appartenir = await prisma.appartenir.create({
    data: {
      numPersonnel: params.id,
      idDepartement: body.departement_id,
      dateDebut: new Date()
    }
  })

  setResponseStatus(event, 201)
  return appartenir
})
