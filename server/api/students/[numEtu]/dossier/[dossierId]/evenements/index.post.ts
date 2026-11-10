import { z } from 'zod/v4'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { prisma } from '~~/server/utils/prisma'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const routeSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema
})

const bodySchema = z.object({
  titre: z.string().trim().min(1, 'Le titre est obligatoire'),
  description: z.string().trim().optional(),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La date doit être au format YYYY-MM-DD'
  }),
  source: z.enum(Demarche_Source),
  status: z.enum(Recherche_Stage_Status),
  contacts: z.array(z.number()).optional().default([])
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId } = await getValidatedRouterParams(event, routeSchema.parse)
  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])
  const body = await readValidatedBody(event, bodySchema.parse)

  const newEvent = await prisma.demarcheEvenement.create({
    data: {
      idRecherche: dossierId,
      titre: body.titre,
      description: body.description,
      date: new Date(`${body.date}T00:00:00.000Z`),
      source: body.source,
      status: body.status,
      DemarcheRechercheContact: {
        create: body.contacts.map(contactId => ({
          idContact: contactId
        }))
      }
    }
  })

  if (!newEvent) {
    return sendError(event, createError({
      statusCode: 500,
      message: 'Erreur lors de la création de l\'événement'
    }))
  }

  const newEventContacts = await prisma.demarcheRechercheContact.findMany({
    where: {
      idDemarche: newEvent.idDemarche
    },
    select: {
      DemarcheContact: true
    }
  }).then(contacts => contacts.map(c => c.DemarcheContact))

  return {
    statusCode: 201,
    data: {
      ...newEvent,
      contacts: newEventContacts
    }
  }
})
