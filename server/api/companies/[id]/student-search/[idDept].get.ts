import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { yearSchema } from '~~/shared/schemas/year'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  idDept: z.coerce.number().int().positive()
})

const querySchema = z.object({
  year: yearSchema
})

defineRouteMeta({
  openAPI: {
    tags: ['companies'],
    description: 'Rechercher des entreprises selon leur nom. Pour les étudiants, les résultats sont limités à 10 entreprises.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'L\'identifiant de l\'entreprise à rechercher.',
        required: true,
        schema: {
          type: 'number'
        }
      },
      {
        name: 'idDept',
        in: 'path',
        description: 'L\'identifiant du département pour lequel rechercher les entreprises.',
        required: true,
        schema: {
          type: 'number'
        }
      },
      {
        name: 'year',
        in: 'query',
        description: 'L\'année pour laquelle rechercher les entreprises.',
        required: true,
        schema: { type: 'string' }
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
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Secretary, UserRole.Teacher])

  // TODO: Ajouter des sécurités, dans la version actuelle, on peut accéder aux données des départements auquels on n'appartient pas.
  // Il faut vérifier que l'utilisateur a le droit d'accéder aux données du département demandé.

  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const query = await getValidatedQuery(event, querySchema.parse)

  return prisma.rechercheStage.findMany({
    where: {
      idEntreprise: params.idDept,
      Inscription: { annee: query.year, Formation: { idDepartement: params.idDept } }
    },
    select: {
      idRecherche: true,
      dateCreation: true,
      Inscription: {
        select: {
          Formation: {
            select: {
              nomFormation: true
            }
          },
          Etudiant: {
            select: {
              nom: true,
              prenom: true
            }
          }
        }
      }
    }
  })
})
