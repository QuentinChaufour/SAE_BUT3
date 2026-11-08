import { z } from 'zod/v4'
import { contactIdSchema } from '~~/shared/schemas/contact'
import { prisma } from '~~/server/utils/prisma'

const schema = z.object({
  contactId: contactIdSchema
})

export default defineEventHandler(async (event) => {
  const { contactId } = await getValidatedRouterParams(event, schema.parse)

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
