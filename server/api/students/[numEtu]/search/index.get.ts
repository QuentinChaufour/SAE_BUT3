import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'
import { studentIdSchema } from '~~/shared/schemas/student'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

// TODO: Protéger la route

const paramsSchema = z.object({
  numEtu: studentIdSchema
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, paramsSchema.parse)
  const numEtu = params.numEtu

  const session = await checkAuth(event, [UserRole.Student, UserRole.Secretary, UserRole.Admin])
  if (session.user.role === UserRole.Student && session.user.numId !== numEtu) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  const searchResults = await prisma.rechercheStage.findMany({
    where: { numEtu },
    orderBy: { dateCreation: 'desc' },
    select: {
      idRecherche: true,
      titre: true,
      dateDerniereModification: true,
      alternance: true,
      status: true,
      Entreprise: {
        select: {
          nom: true,
          ville: true
        }
      },
      DepartementTagRecherche: {
        select: {
          DepartementTag: {
            select: {
              nomTag: true
            }
          }
        }
      }
    }
  })
  return searchResults
})
