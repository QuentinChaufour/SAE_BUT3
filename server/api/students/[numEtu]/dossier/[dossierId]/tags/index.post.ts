import { z } from 'zod/v4'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { prisma } from '~~/server/utils/prisma'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const paramsSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema
})

const addTagSchema = z.object({
  tag: z.string().nonoptional()
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)
  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])
  const { tag } = await readValidatedBody(event, addTagSchema.parse)

  try {
    const tagId = await prisma.departementTag.findFirst({
      where: {
        nomTag: tag
      },
      select: {
        idTag: true
      }
    })

    if (!tagId) {
      throw new Error('Tag not found')
    }

    await prisma.departementTagRecherche.create({
      data: {
        idRecherche: dossierId,
        idTag: tagId.idTag
      }
    })

    return {
      statusCode: 200,
      message: `Tag : ${tag} Added successfully`
    }
  } catch {
    throw createError({
      statusCode: 404,
      message: `Tag: ${tag} not found`
    })
  }
})
