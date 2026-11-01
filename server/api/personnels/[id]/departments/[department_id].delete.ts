import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod'
import { numPersonnelSchema } from '~~/shared/schemas/personnel'

const paramsSchema = z.object({
  id: numPersonnelSchema,
  departement_id: z.coerce.number().int().positive('L\'identifiant du département doit être un nombre entier positif.')
})

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Détacher un personnel d\'un département spécifique.',
    responses: {
      204: { description: 'Le rattachement a été supprimé avec succès.' },
      400: { description: 'Les paramètres fournis sont invalides.' },
      403: { description: 'Forbidden' },
      404: { description: 'Rattachement non trouvé.' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  const appartenir = await prisma.appartenir.findFirst({
    where: {
      numPersonnel: params.id,
      idDepartement: params.departement_id
    }
  })

  if (!appartenir) {
    throw createError({
      statusCode: 404,
      message: 'Rattachement non trouvé.'
    })
  }

  await prisma.appartenir.delete({ where: { idAppartenance: appartenir.idAppartenance } })

  return sendNoContent(event)
})
