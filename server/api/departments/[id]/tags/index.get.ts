import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import { departementIdSchema } from '~~/shared/schemas/departement'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const paramsSchema = z.object({
  id: departementIdSchema
})

export default defineEventHandler(async (event) => {
  // Validate the route parameters using the schema, or throw an error if validation fails
  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  await checkAuth(event, [UserRole.Student, UserRole.Teacher, UserRole.Admin, UserRole.Secretary])

  // Fetch the corresponding department tags
  const departementTags = await prisma.departementTag.findMany({
    where: {
      idDepartement: params.id
    },
    select: {
      nomTag: true
    }
  })

  // Return the department tags in the response under the "data" key, along with a success status
  return {
    statusCode: 200,
    data: departementTags
  }
})
