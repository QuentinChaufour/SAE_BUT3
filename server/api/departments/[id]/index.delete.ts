import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive('L\'identifiant du département doit être un nombre entier positif.')
})

defineRouteMeta({
  openAPI: {
    tags: ['departments'],
    description: 'Supprimer un département existant (et les données associées).',
    responses: {
      204: { description: 'Le département a été supprimé avec succès.' },
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

  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  await prisma.$transaction(async (tx) => {
    await tx.departementTag.deleteMany({ where: { idDepartement: params.id } }) // Tags
    await tx.formation.deleteMany({ where: { idDepartement: params.id } }) // Formations
    await tx.anneeEnseignant.deleteMany({ where: { idDepartement: params.id } }) // Années enseignants
    await tx.appartenir.deleteMany({ where: { idDepartement: params.id } }) // Appartenir
    await tx.departement.delete({ where: { idDepartement: params.id } }) // Département
  })

  return sendNoContent(event)
})
