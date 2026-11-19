import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

defineRouteMeta({
  openAPI: {
    tags: ['companies'],
    description: 'Supprimer une entreprise selon son identifiant. Cette action supprimera également toutes les recherches liées à cette entreprise.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        description: 'L\'identifiant de l\'entreprise à supprimer.',
        required: true,
        schema: { type: 'number' }
      }
    ],
    responses: {
      204: { description: 'Le département a été supprimé avec succès.' },
      404: { description: 'L\'entreprise demandée n\'a pas été trouvée.' },
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Secretary])

  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  const deleted = await prisma.entreprise.delete({ where: { idEntreprise: params.id } })
  if (!deleted) throw createError({ statusCode: 404, message: 'Company not found' })

  return sendNoContent(event)
})
