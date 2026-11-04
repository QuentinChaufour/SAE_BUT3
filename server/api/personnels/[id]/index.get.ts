import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod'
import { numPersonnelSchema } from '~~/shared/schemas/personnel'

const paramsSchema = z.object({
  id: numPersonnelSchema
})

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Obtenir les détails d\'un personnel spécifique, incluant ses départements.',
    responses: {
      200: {
        description: 'Les informations du personnel.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                numPersonnel: { type: 'string' },
                nom: { type: 'string' },
                prenom: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'secretariat'] },
                Appartenir: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      idAppartenance: { type: 'number' },
                      dateDebut: { type: 'string' },
                      dateFin: { type: 'string', nullable: true },
                      Departement: {
                        type: 'object',
                        properties: {
                          idDepartement: { type: 'number' },
                          nom: { type: 'string' }
                        }
                      }
                    }
                  }
                }
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

  const personnel = await prisma.personnel.findUnique({
    where: { numPersonnel: params.id },
    select: {
      numPersonnel: true,
      nom: true,
      prenom: true,
      email: true,
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
  })

  if (!personnel) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel non trouvé.'
    })
  }

  return personnel
})
