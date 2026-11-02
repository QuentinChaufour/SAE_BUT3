import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import { contactSchema } from '~~/shared/schemas/contact'
import { eventIdSchema } from '~~/shared/schemas/dossier'
// TODO add 'autre' to Demarche source enum

const schema = z.object({
  eventId: eventIdSchema
})

export default defineEventHandler(async (event) => {
  // Validate the eventId from the route parameters and the request body
  const { eventId } = await getValidatedRouterParams(event, schema.parse)
  // Validate the request body against the contactSchema
  const body = await readValidatedBody(event, contactSchema.parse)

  // check if event exists before creating the contact to prevent
  // duplicate contacts for non-existing events
  const existingEvent = await prisma.demarcheEvenement.findUnique({
    where: {
      idDemarche: eventId
    }
  })

  if (!existingEvent) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: 'Event not found'
    }))
  }

  const contact = await prisma.demarcheContact.create({
    data: {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      telephone: body.telephone,
      fonction: body.fonction
    }
  })

  const demarcheRechercheContact = await prisma.demarcheRechercheContact.create({
    data: {
      idContact: contact.idContact,
      idDemarche: eventId
    }
  })

  // Check if the demarcheRechercheContact was created successfully
  // If not, return an error response (e.g., if the event does not exist)
  if (!demarcheRechercheContact) {
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création du contact'
    }))
  }

  // return the created contact if successful
  return {
    success: true,
    data: {
      contact: contact
    }
  }
})
