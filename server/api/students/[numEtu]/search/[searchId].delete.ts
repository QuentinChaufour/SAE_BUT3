import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import UserRole from '~~/shared/types/role'
import { studentIdSchema } from '~~/shared/schemas/student'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'

const paramsSchema = z.object({
  numEtu: studentIdSchema,
  searchId: z.coerce.number().int().positive('L\'identifiant de la recherche doit être un entier positif.')
})

defineRouteMeta({
  openAPI: {
    tags: ['students'],
    description: 'Supprimer une recherche d\'un étudiant.',
    responses: {
      204: { description: 'Le département a été supprimé avec succès.' },
      400: { description: 'Les paramètres ou les données fournies sont invalides.' },
      404: { description: 'La recherche demandée n\'a pas été trouvée.' },
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  await checkAuthWithOnlySelfStudentData(event, params.numEtu, [UserRole.Student])

  const exist = await prisma.rechercheStage.count({
    where: { idRecherche: params.searchId, Inscription: { numEtu: params.numEtu } }
  })
  if (!exist) throw createError({ statusCode: 404, message: 'Search not found' })

  const searchId = params.searchId
  await prisma.$transaction(async (tx) => {
    // TODO: Supprimer les pièces jointes stockées également

    await tx.rechercheStage.delete({ where: { idRecherche: searchId } })
  })

  return sendNoContent(event)
})
