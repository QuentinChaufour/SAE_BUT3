import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import { contactSchema } from '~~/shared/schemas/contact'

export default defineEventHandler(async (event) => {

  // Validate the request body against the contactSchema
  const body = await readValidatedBody(event, contactSchema.parse)

  const contact = await prisma.demarcheContact.create({
    data: {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      telephone: body.telephone,
      fonction: body.fonction,
      idRecherche: body.idRecherche
    }
  })

  // Check if the demarcheRechercheContact was created successfully
  // If not, return an error response (e.g., if the event does not exist)
  if (!contact) {
    return sendError(event, createError({
      statusCode: 500,
      message: 'Erreur lors de la création du contact'
    }))
  }

  return {
    statusCode: 201,
    data: contact
  }
})
