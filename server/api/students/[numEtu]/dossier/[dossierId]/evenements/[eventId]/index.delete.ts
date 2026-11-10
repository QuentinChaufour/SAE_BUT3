import { z } from 'zod/v4'
import { dossierIdSchema, eventIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { prisma } from '~~/server/utils/prisma'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const routeSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema,
  eventId: eventIdSchema
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId, eventId } = (await getValidatedRouterParams(event, routeSchema.parse))

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])

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
