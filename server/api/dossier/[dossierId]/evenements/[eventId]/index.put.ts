import { z } from 'zod/v4'
import { dossierIdSchema, eventIdSchema } from '~~/shared/schemas/dossier'
import { prisma } from '~~/server/utils/prisma'
import { Demarche_Source , Recherche_Stage_Status } from '~~/generated/prisma/enums'

const routeSchema = z.object({
  dossierId : dossierIdSchema,
  eventId: eventIdSchema,
})

const bodySchema = z.object({
  titre: z.string().trim().min(1, 'Le titre est obligatoire'),
  description: z.string().trim().optional(),
  date: z.string().trim().refine((date) => !isNaN(Date.parse(date)), {
    message: "La date n'est pas valide",
  }),
  source: z.enum(Demarche_Source),
  status: z.enum(Recherche_Stage_Status),
  contacts: z.array(z.number()).min(1, { message: "Au moins un contact doit être sélectionné" }),
})

export default defineEventHandler(async (event) => {
  
  const { dossierId, eventId } = await getValidatedRouterParams(event, routeSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  const updatedEvent = await prisma.demarcheEvenement.update({
    where: {
      idRecherche: dossierId,
      idDemarche: eventId
    },
    data: {
      titre: body.titre,
      description: body.description,
      date: new Date(body.date),
      source: body.source,
      status: body.status,
    },
  })

  if(!updatedEvent) {
    return sendError(event,createError({
      statusCode: 404,
      statusMessage: "Impossible de trouver l'événement à mettre à jour",
    }))
  }

  const oldContactsIds = await prisma.demarcheRechercheContact.findMany({
    where: {
      idDemarche: updatedEvent.idDemarche,
    },
    select: {
      DemarcheContact: {
        select: {
          idContact: true,
        }
      },
    },
  }).then((contacts) => contacts.map((c) => c.DemarcheContact.idContact))

  // Add new contacts
  body.contacts.forEach(async (contactId) => {
    if(!oldContactsIds.find((c) => c === contactId)){
      // the contact was added
      await prisma.demarcheRechercheContact.create({
        data: {
          idDemarche: updatedEvent.idDemarche,
          idContact: contactId,
        }
      })
    }
  })

  // Remove deleted contacts
  oldContactsIds.forEach( async(contactId) => {
    if(!body.contacts.find((c) => c === contactId)){
      // the contact was removed
      await prisma.demarcheRechercheContact.delete({
        where: {
          idDemarche_idContact: {
            idContact : contactId,
            idDemarche : updatedEvent.idDemarche,
          }
        }
      })
    }
  })

  const newEventContacts = await prisma.demarcheRechercheContact.findMany({
    where: {
      idDemarche: updatedEvent.idDemarche,
    },
    select: {
      DemarcheContact: true,
    },
  }).then((contacts) => contacts.map((c) => c.DemarcheContact))

  return {
    statusCode: 200,
    data: {
      ...updatedEvent,
      contacts: newEventContacts,
    },
  }
})
