import { z } from 'zod/v4'
import { dossierIdSchema } from '~~/shared/schemas/dossier'

// TODO SAME 
const paramsSchema = z.object({
  dossierId: dossierIdSchema
})

// TODO extern => shared
const addTagSchema = z.object({
  tag: z.string().nonoptional()
})

export default defineEventHandler(async (event) => {
  const { dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)
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

    const createdTag = await prisma.departementTagRecherche.create({
      data: {
        idRecherche: dossierId,
        idTag: tagId.idTag
      }
    })
  } 
  catch {
    throw createError({
      statusCode: 404,
      statusMessage: `Tag: ${tag} not found`
    })
  }

  return {
    statusCode: 200,
    message: `Tag : ${tag} Added successfully`
  }
})
