import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

const querySchema = z.object({
  search: z.string().trim().nonempty()
})

defineRouteMeta({
  openAPI: {
    tags: ['companies'],
    description: 'Rechercher des entreprises selon leur nom.',
    parameters: [
      {
        name: 'search',
        in: 'query',
        description: 'Le nom de l\'entreprise à rechercher.',
        required: true,
        schema: {
          type: 'string'
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
  await checkAuth(event, [UserRole.Student, UserRole.Secretary])

  const query = await getValidatedQuery(event, querySchema.parse)

  const searchResults = await prisma.entreprise.findMany({
    where: { nom: { contains: query.search, mode: 'insensitive' } },
    take: 10,
    select: {
      idEntreprise: true,
      nom: true,
      ville: true,
      codePostal: true
    }
  })
  return searchResults
})
