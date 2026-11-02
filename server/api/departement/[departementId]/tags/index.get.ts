import { z } from 'zod/v4'
import { departementIdSchema } from '~~/shared/schemas/departement'

const paramsSchema = z.object({
  departementId: departementIdSchema
})

export default defineEventHandler(async (event) => {
  // Validate the route parameters using the schema, or throw an error if validation fails
  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  // Fetch the corresponding department tags
  const departementTags = await prisma.departementTag.findMany({
    where: {
      idDepartement: params.departementId
    },
    select: {
      nomTag: true
    }
  })

  // Return the department tags in the response under the "data" key, along with a success status
  return {
    success: true,
    data: departementTags
  }
})
