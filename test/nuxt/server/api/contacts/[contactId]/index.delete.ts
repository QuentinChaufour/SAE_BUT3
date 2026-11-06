import { z } from 'zod/v4'
import { contactIdSchema } from '~~/shared/schemas/contact'

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
      statusMessage: 'Contact not found'
    }))
  }
  return {
    statusCode: 204
  }
})
