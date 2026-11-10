import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'
import { z } from 'zod/v4'
import { numPersonnelSchema } from '~~/shared/schemas/personnel'

const paramsSchema = z.object({
  id: numPersonnelSchema
})

defineRouteMeta({
  openAPI: {
    tags: ['personnels'],
    description: 'Supprimer un personnel de la base de données',
    responses: {
      204: { description: 'Le personnel a été supprimé avec succès.' },
      403: { description: 'Forbidden' },
      404: { description: 'Personnel non trouvé.' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Admin])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  const personnel = await prisma.personnel.count({ where: { numPersonnel: params.id } })
  if (!personnel) throw createError({ statusCode: 404, message: 'Personnel non trouvé.' })

  await prisma.$transaction(async (tx) => {
    await tx.appartenir.deleteMany({ where: { numPersonnel: params.id } })
    await tx.personnel.delete({ where: { numPersonnel: params.id } })
  })

  return sendNoContent(event)
})
