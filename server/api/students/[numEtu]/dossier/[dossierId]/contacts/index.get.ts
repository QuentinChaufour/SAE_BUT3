import { prisma } from '~~/server/utils/prisma'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { z } from 'zod/v4'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const schema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId } = await getValidatedRouterParams(event, schema.parse)
  
  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student, UserRole.Secretary, UserRole.Teacher, UserRole.Admin])
  
  const contacts = await prisma.demarcheContact.findMany({
    where: {
      idRecherche: dossierId
    }
  })

  if (!contacts) {
    return {
      statusCode: 404,
      data: null
    }
  }

  return {
    statusCode: 200,
    data: contacts
  }
})
