import { z } from 'zod/v4'
import { dossierIdSchema } from '~~/shared/schemas/dossier'

const paramsSchema = z.object({
  dossierId: dossierIdSchema
})

const bodySchema = z.object({
  description: z.string().optional(),
  titre: z.string().optional(),
  alternance: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)

  const body = await readValidatedBody(event, bodySchema.parse)

  if(Object.keys(body).length === 0) {
    return sendError(event, createError({
      statusCode: 400,
      statusMessage: 'No data provided for update'
    }))
  }

  // récupérer le dossier de recherche
  const dossier = await prisma.rechercheStage.update({
    where: {
      idRecherche: dossierId
    },
    data: body
  })

  if (!dossier) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: 'Dossier not found'
    }))
  }

  return { 
    statusCode: 200,
    data: dossier 
  }
})
