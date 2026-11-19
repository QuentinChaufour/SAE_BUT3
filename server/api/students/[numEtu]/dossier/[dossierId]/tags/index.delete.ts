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

const deleteTagSchema = z.object({
  tag: z.string().nonoptional()
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])

  const { tag } = await readValidatedBody(event, deleteTagSchema.parse)

  try {
    const tagId = await findTagIdByName(dossierId, tag)
    await prisma.departementTagRecherche.delete({
      where: {
        idRecherche_idTag: {
          idRecherche: dossierId,
          idTag: tagId
        }
      }
    })
  } catch {
    throw createError({
      statusCode: 404,
      message: `Tag: ${tag} not found`
    })
  }

  return {
    statusCode: 200,
    message: `Tag : ${tag} deleted successfully`
  }
})

async function findTagIdByName(dossierId: number, tagName: string) {
  const tag = await prisma.departementTagRecherche.findFirst({
    where: {
      idRecherche: dossierId,
      DepartementTag: {
        nomTag: tagName
      }
    },
    select: {
      idTag: true
    }
  })

  if (!tag) {
    throw new Error('Tag not found')
  }

  return tag.idTag
}
