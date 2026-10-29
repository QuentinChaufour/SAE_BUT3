import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import { studentIdSchema } from '~~/shared/schemas/student'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

const paramsSchema = z.object({
  numEtu: studentIdSchema
})

defineRouteMeta({
  openAPI: {
    tags: ['students'],
    description: 'Lister les recherches de stage d\'un étudiant.',
    parameters: [
      {
        name: 'numEtu',
        in: 'path',
        required: true,
        description: 'Numéro de l\'étudiant.',
        schema: {
          type: 'string'
        }
      }
    ],
    responses: {
      200: {
        description: 'La liste des recherches de stage de l\'étudiant.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idRecherche: { type: 'number' },
                  titre: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  dateDerniereModification: { type: 'string', format: 'date-time' },
                  alternance: { type: 'boolean' },
                  status: {
                    type: 'string',
                    enum: ['Accepte', 'Refuse', 'Abandon', 'Entretien', 'AttenteReponse', 'AttenteEnvoi']
                  },
                  Entreprise: {
                    type: 'object',
                    properties: {
                      nom: { type: 'string' },
                      ville: { type: 'string' }
                    }
                  },
                  DepartementTagRecherche: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        DepartementTag: {
                          type: 'object',
                          properties: {
                            nomTag: { type: 'string' }
                          }
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
      400: {
        description: 'Le numéro étudiant est invalide.'
      },
      403: {
        description: 'Forbidden'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const numEtu = params.numEtu

  const session = await checkAuth(event, [UserRole.Student, UserRole.Secretary, UserRole.Admin])
  if (session.user.role === UserRole.Student && session.user.numId !== numEtu) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  const searchResults = await prisma.rechercheStage.findMany({
    where: { numEtu },
    orderBy: { dateCreation: 'desc' },
    select: {
      idRecherche: true,
      titre: true,
      dateDerniereModification: true,
      alternance: true,
      status: true,
      Entreprise: {
        select: {
          nom: true,
          ville: true
        }
      },
      DepartementTagRecherche: {
        select: {
          DepartementTag: {
            select: {
              nomTag: true
            }
          }
        }
      }
    }
  })
  return searchResults
})
