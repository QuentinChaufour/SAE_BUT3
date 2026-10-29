import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

const querySchema = z.object({
  search: z.string().trim().nonempty()
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Student, UserRole.Secretary])

  const query = await getValidatedQuery(event, querySchema.parse)

  const searchResults = await prisma.entreprise.findMany({
    where: { nom: { contains: query.search, mode: 'insensitive' } },
    take: 10,
    select: {
      idEntreprise: true,
      nom: true,
      ville: true,
      codePostal: true
    }
  })
  return searchResults
})
