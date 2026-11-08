import { z } from 'zod/v4'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { prisma } from '~~/server/utils/prisma'
import { Demarche_Source , Recherche_Stage_Status } from '~~/generated/prisma/enums'
import { stringToDate } from '~~/shared/utils/date'

const routeSchema = z.object({
  dossierId : dossierIdSchema,
})

const bodySchema = z.object({
  titre: z.string().trim().min(1, 'Le titre est obligatoire'),
  description: z.string().trim().optional(),
  date: z.string().trim().refine((date) => {
      const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date)
      
      if (!match) return false
      
      const [, day, month, year] = match
      const parsed = new Date(Number(year), Number(month) - 1, Number(day))
      
      return parsed.getFullYear() === Number(year)
        && parsed.getMonth() === Number(month) - 1
        && parsed.getDate() === Number(day)
    }, {
      message: "La date n'est pas valide",
    }),
  source: z.enum(Demarche_Source),
  status: z.enum(Recherche_Stage_Status),
  contacts: z.array(z.number()).optional().default([]),
})

export default defineEventHandler(async (event) => {
  
  const { dossierId } = await getValidatedRouterParams(event, routeSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  const newEvent = await prisma.demarcheEvenement.create({
    data: {
      idRecherche: dossierId,
      titre: body.titre,
      description: body.description,
      date: stringToDate(body.date),
      source: body.source,
      status: body.status,
      DemarcheRechercheContact: {
        create: body.contacts.map((contactId) => ({
          idContact: contactId,
        })),
      }
    },
  })


  if(!newEvent) {
    return sendError(event,createError({
      statusCode: 500,
      message: "Erreur lors de la création de l'événement",
    }))
  }

  const newEventContacts = await prisma.demarcheRechercheContact.findMany({
    where: {
      idDemarche: newEvent.idDemarche,
    },
    select: {
      DemarcheContact: true,
    },
  }).then((contacts) => contacts.map((c) => c.DemarcheContact))

  return {
    statusCode: 201,
    data: {
      ...newEvent,
      contacts: newEventContacts,
    },
  }
})
