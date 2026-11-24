import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const paramsSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema
})

const bodySchema = z.object({
  description: z.string().optional(),
  titre: z.string().optional(),
  alternance: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])

  const body = await readValidatedBody(event, bodySchema.parse)

  if (Object.keys(body).length === 0) {
    return sendError(event, createError({
      statusCode: 400,
      message: 'No data provided for update'
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
      message: 'Dossier not found'
    }))
  }

  return {
    statusCode: 200,
    data: dossier
  }
})
