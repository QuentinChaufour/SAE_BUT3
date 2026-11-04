import { z } from 'zod/v4'
import { contactIdSchema, contactSchema } from '~~/shared/schemas/contact'

const schema = z.object({
  contactId: contactIdSchema
})

export default defineEventHandler(async (event) => {
  const { contactId } = await getValidatedRouterParams(event, schema.parse)
  const body = await readValidatedBody(event, contactSchema.partial().parse)

  const updatedContact = await prisma.demarcheContact.update({
    where: {
      idContact: contactId
    },
    data: body
  })

  return updatedContact
})
