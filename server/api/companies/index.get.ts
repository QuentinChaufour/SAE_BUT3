import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import type { EntrepriseWhereInput } from '~~/generated/prisma/models'

const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  idDepartment: z.coerce.number().int().positive().optional() // TODO: A remplacer, uniformé dans les schemas dans une autre PR
})

defineRouteMeta({
  openAPI: {
    tags: ['companies'],
    description: 'Rechercher des entreprises selon leur nom. Pour les étudiants, les résultats sont limités à 10 entreprises.',
    parameters: [
      {
        name: 'search',
        in: 'query',
        description: 'Le nom de l\'entreprise à rechercher. Obligatoire pour les étudiants.',
        required: false,
        schema: {
          type: 'string'
        }
      },
      {
        name: 'idDepartment',
        in: 'query',
        description: 'Les entreprises étant liées à un département spécifique.',
        required: false,
        schema: {
          type: 'number'
        }
      }
    ],
    responses: {
      200: {
        description: 'La liste des entreprises correspondant à la recherche.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idEntreprise: { type: 'number' },
                  nom: { type: 'string' },
                  ville: { type: 'string' },
                  codePostal: { type: 'string' }
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
  const session = await checkAuth(event, [UserRole.Student, UserRole.Secretary, UserRole.Teacher])

  const query = await getValidatedQuery(event, querySchema.parse)

  if (!query.search && session.role === UserRole.Student) {
    throw createError({
      statusCode: 403,
      message: 'La recherche d\'entreprises est obligatoire pour les étudiants.'
    })
  }

  const where: EntrepriseWhereInput = {}
  if (query.search) where.nom = { contains: query.search, mode: 'insensitive' }
  if (query.idDepartment) where.RechercheStage = { some: { Inscription: { Formation: { idDepartement: query.idDepartment } } } }

  const searchResults = await prisma.entreprise.findMany({
    where,
    take: session.role === UserRole.Student ? 10 : undefined,
    select: {
      idEntreprise: true,
      nom: true,
      ville: true,
      codePostal: true
    }
  })
  return searchResults
})
