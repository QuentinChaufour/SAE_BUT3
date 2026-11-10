import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import { contactIdSchema, contactSchema } from '~~/shared/schemas/contact'
import { studentIdSchema } from '~~/shared/schemas/student'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const schema = z.object({
  numEtu: studentIdSchema,
  contactId: contactIdSchema
})

export default defineEventHandler(async (event) => {
  const { numEtu, contactId } = await getValidatedRouterParams(event, schema.parse)

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])

  const body = await readValidatedBody(event, contactSchema.partial().parse)

  const updatedContact = await prisma.demarcheContact.update({
    where: {
      idContact: contactId
    },
    data: body
  })

  return {
    statusCode: 200,
    data: updatedContact
  }
})
