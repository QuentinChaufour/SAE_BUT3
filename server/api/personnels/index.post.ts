import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { personnelBodySchema } from '~~/shared/schemas/personnel'

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Créer un personnel (admin ou secrétariat), avec rattachement optionnel à des départements.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['numPersonnel', 'nom', 'prenom', 'role'],
            properties: {
              numPersonnel: { type: 'string', description: 'Numéro du personnel' },
              nom: { type: 'string', description: 'Nom du personnel' },
              prenom: { type: 'string', description: 'Prénom du personnel' },
              role: { type: 'string', enum: ['admin', 'secretariat'], description: 'Rôle du personnel' },
              department_ids: {
                type: 'array',
                items: { type: 'number' },
                description: 'Liste optionnelle des identifiants de départements à rattacher (uniquement secrétariat)'
              }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Le personnel créé.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                numPersonnel: { type: 'string' },
                nom: { type: 'string' },
                prenom: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'secretariat'] }
              }
            }
          }
        }
      },
      400: { description: 'Les données fournies sont invalides.' },
      403: { description: 'Forbidden' },
      409: { description: 'Ce numéro personnel existe déjà.' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const body = await readValidatedBody(event, personnelBodySchema.parse)

  const existing = await prisma.personnel.count({ where: { numPersonnel: body.numPersonnel } })
  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Ce numéro personnel existe déjà.'
    })
  }

  const created = await prisma.$transaction(async (tx) => {
    const personnel = await tx.personnel.create({
      data: {
        numPersonnel: body.numPersonnel,
        nom: body.nom,
        prenom: body.prenom,
        role: body.role
      }
    })

    if (body.role === 'secretariat' && body.department_ids && body.department_ids.length > 0) {
      await tx.appartenir.createMany({
        data: body.department_ids.map(idDepartement => ({
          numPersonnel: body.numPersonnel,
          idDepartement,
          dateDebut: new Date()
        }))
      })
    }

    return personnel
  })

  setResponseStatus(event, 201)
  return created
})
