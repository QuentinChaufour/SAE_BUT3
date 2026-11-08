import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'
import { getCurrentAcademicYear } from '~~/server/utils/year'
import { nomDepartementSchema } from '~~/shared/schemas/department'

const bodySchema = z.object({
  nom: nomDepartementSchema
})

defineRouteMeta({
  openAPI: {
    tags: ['departments'],
    description: 'Créer un département.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nom'],
            properties: {
              nom: {
                type: 'string',
                description: 'Nom du département'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Le département créé.',
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

  const body = await readValidatedBody(event, bodySchema.parse)

  const year = getCurrentAcademicYear()

  await prisma.anneeUniversitaire.upsert({
    where: { annee: year },
    update: {},
    create: { annee: year }
  })

  const created = await prisma.departement.create({
    data: {
      nom: body.nom,
      anneeActuelle: year
    }
  })
  return created
})
