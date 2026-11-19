import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod/v4'
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import type { EntrepriseWhereInput } from '~~/generated/prisma/models'
import { departementIdSchema } from '~~/shared/schemas/departement'

const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  idDepartment: departementIdSchema.optional()
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
        description: 'La liste des 10 premières entreprises correspondant à la recherche.',
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
                  codePostal: { type: 'string' },
                  adresse: { type: 'string' },
                  pays: { type: 'string' },
                  nomEtab: { type: 'string' },
                  nombreCandidatures: { type: 'number', nullable: true },
                  nombreCandidaturesAcceptees: { type: 'number', nullable: true }
                }
              }
            }
          }
        }
      },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await checkAuth(event, [UserRole.Student, UserRole.Secretary, UserRole.Teacher])

  const query = await getValidatedQuery(event, querySchema.parse)

  if (!query.search && session.user.role === UserRole.Student) {
    throw createError({
      statusCode: 403,
      message: 'La recherche d\'entreprises est obligatoire pour les étudiants.'
    })
  }

  const where: EntrepriseWhereInput = {}
  if (query.search) where.nom = { contains: query.search, mode: 'insensitive' }
  if (query.idDepartment) where.RechercheStage = { some: { Inscription: { Formation: { idDepartement: query.idDepartment } } } }

  const canViewApplicationCounts = session.user.role !== UserRole.Student
  const searchResults = await prisma.entreprise.findMany({
    where,
    take: session.user.role === UserRole.Student ? 10 : undefined,
    select: {
      idEntreprise: true,
      nom: true,
      nomEtab: true,
      ville: true,
      adresse: true,
      pays: true,
      siret: true,
      codePostal: true,
      ...(canViewApplicationCounts && {
        _count: {
          select: {
            RechercheStage: true
          }
        },
        RechercheStage: {
          where: { status: Recherche_Stage_Status.Accepte },
          select: { idRecherche: true }
        }
      })
    }
  })

  if (!canViewApplicationCounts) return searchResults

  return searchResults.map(({ _count, RechercheStage, ...company }) => ({
    ...company,
    nbCandidatures: _count.RechercheStage,
    nbAcceptedCandidatures: RechercheStage.length
  }))
})
