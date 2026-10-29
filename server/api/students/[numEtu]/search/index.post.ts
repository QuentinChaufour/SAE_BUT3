import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'

import { studentIdSchema } from '~~/shared/schemas/student'
import { yearSchema } from '~~/shared/schemas/year'
import { studentSearchFields } from '~~/shared/schemas/student-search'
import { checkAuth } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

// TODO: Protéger la route

const paramsSchema = z.object({
  numEtu: studentIdSchema
})

const bodySchema = studentSearchFields.extend({ annee: yearSchema })

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, paramsSchema.parse)

  const session = await checkAuth(event, [UserRole.Student])
  if (session.user.role === UserRole.Student && session.user.numId !== params.numEtu) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const created = await prisma.rechercheStage.create({
    data: {
      titre: body.titre,
      description: body.description,
      alternance: body.alternance,
      annee: body.annee,
      idEntreprise: body.idEntreprise,
      numEtu: params.numEtu
    }
  })
  return created
})
