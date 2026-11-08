import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import { studentIdSchema } from '~~/shared/schemas/student'
import UserRole from '~~/shared/types/role'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'

const paramsSchema = z.object({
  numEtu: studentIdSchema
})

const querySchema = z.object({
  idInscription: z.coerce.number().positive('L\'identifiant de l\'inscription doit être un entier positif.')
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
      },
      {
        name: 'idInscription',
        in: 'query',
        required: true,
        description: 'Identifiant de l\'inscription de l\'étudiant.',
        schema: {
          type: 'number'
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
  const { numEtu } = await getValidatedRouterParams(event, paramsSchema.parse)

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student, UserRole.Secretary, UserRole.Admin])

  const { idInscription } = await getValidatedQuery(event, querySchema.parse)

  const searchResults = await prisma.rechercheStage.findMany({
    where: { Inscription: { numEtu, idInscription } },
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
