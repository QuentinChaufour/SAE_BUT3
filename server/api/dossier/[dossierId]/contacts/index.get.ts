import { prisma } from '~~/server/utils/prisma'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { z } from 'zod/v4'

const schema = z.object({
  dossierId: dossierIdSchema
})

export default defineEventHandler(async (event) => {
  const { dossierId } = await getValidatedRouterParams(event, schema.parse)

  const contacts = await prisma.demarcheEvenement.findMany({
    where: {
      idRecherche: dossierId,
    },
    select: {
      DemarcheRechercheContact: {
        select: {
          DemarcheContact: true
        }
      }
    }
  })

  const formattedContacts = contacts.map(contact => contact.DemarcheRechercheContact.map(c => c.DemarcheContact)).flat()

  if(!contacts) {
    return {
      statusCode: 404,
      data: null  
    }
  }

  return {
    statusCode: 200,
    data: formattedContacts
  }
})
