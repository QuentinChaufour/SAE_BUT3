import { z } from 'zod/v4'
import { contactIdSchema } from '~~/shared/schemas/contact'
import { prisma } from '~~/server/utils/prisma'
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

  const deletedContact = await prisma.$transaction(async (tx) => {
    await tx.demarcheRechercheContact.deleteMany({
      where: {
        idContact: contactId
      }
    })
    return await tx.demarcheContact.delete({
      where: {
        idContact: contactId
      }
    })
  })

  if (!deletedContact) {
    return sendError(event, createError({
      statusCode: 404,
      message: 'Contact not found'
    }))
  }
  return {
    statusCode: 204
  }
})
