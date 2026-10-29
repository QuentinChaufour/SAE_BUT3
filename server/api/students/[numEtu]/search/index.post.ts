import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'

import { studentIdSchema } from '~~/shared/schemas/student'
import { yearSchema } from '~~/shared/schemas/year'
import { studentSearchFields } from '~~/shared/schemas/student-search'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

// TODO: Protéger la route

const paramsSchema = z.object({
  numEtu: studentIdSchema
})

const bodySchema = studentSearchFields.extend({ annee: yearSchema })

defineRouteMeta({
  openAPI: {
    tags: ['students'],
    description: 'Créer une recherche de stage pour un étudiant.',
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
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['titre', 'alternance', 'idEntreprise', 'annee'],
            properties: {
              titre: {
                type: 'string',
                description: 'Titre de la recherche de stage (5 à 100 caractères).'
              },
              description: {
                type: 'string',
                nullable: true,
                description: 'Description de la recherche (2000 caractères maximum).'
              },
              alternance: {
                type: 'boolean',
                description: 'Indique si la recherche concerne une alternance.'
              },
              idEntreprise: {
                type: 'number',
                description: 'Identifiant de l’entreprise ciblée.'
              },
              annee: {
                type: 'string',
                description: 'Année universitaire de la recherche.'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'La recherche de stage créée.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                idRecherche: { type: 'number' },
                titre: { type: 'string' },
                description: { type: 'string', nullable: true },
                alternance: { type: 'boolean' },
                idEntreprise: { type: 'number' },
                numEtu: { type: 'string' },
                annee: { type: 'string' },
                dateCreation: { type: 'string', format: 'date-time' },
                dateDerniereModification: { type: 'string', format: 'date-time' },
                status: { type: 'string' }
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
  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  const session = await checkAuth(event, [UserRole.Student])
  if (session.user.role === UserRole.Student && session.user.numId !== params.numEtu) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const created = await prisma.rechercheStage.create({
    data: {
      titre: body.titre,
      description: body.description,
      alternance: body.alternance,
      annee: body.annee,
      idEntreprise: body.idEntreprise,
      numEtu: params.numEtu
    }
  })
  return created
})
