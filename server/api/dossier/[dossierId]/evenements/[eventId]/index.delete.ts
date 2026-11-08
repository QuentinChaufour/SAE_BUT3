import { z } from 'zod/v4'
import { dossierIdSchema, eventIdSchema } from '~~/shared/schemas/dossier'
import { prisma } from '~~/server/utils/prisma'

const routeSchema = z.object({
  dossierId: dossierIdSchema,
  eventId: eventIdSchema
})

export default defineEventHandler(async (event) => {
  const { dossierId, eventId } = (await getValidatedRouterParams(event, routeSchema.parse))

  await prisma.demarcheRechercheContact.deleteMany({
    where: {
      idDemarche: eventId
    }
  })

  const updatedEvent = await prisma.demarcheEvenement.delete({
    where: {
      idRecherche: dossierId,
      idDemarche: eventId
    }
  })

  if (!updatedEvent) {
    return sendError(event, createError({
      statusCode: 404,
      message: 'Impossible de trouver l\'événement à mettre à jour'
    }))
  }

  return {
    statusCode: 204
  }
})
