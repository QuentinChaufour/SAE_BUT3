import { prisma } from '~~/server/utils/prisma'
import { z } from 'zod'

import { studentIdSchema } from '~~/shared/schemas/student'
import { yearSchema } from '~~/shared/schemas/year'
import { studentSearchFields } from '~~/shared/schemas/student-search'

// TODO: Protéger la route

const paramsSchema = z.object({
  numEtu: studentIdSchema
})

const bodySchema = studentSearchFields.extend({ annee: yearSchema })

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, paramsSchema.parse)
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
