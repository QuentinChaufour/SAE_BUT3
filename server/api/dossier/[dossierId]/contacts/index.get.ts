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
        },
      },
    },
  })

  const idSet = new Set<number>()
  const formattedContacts = contacts.map(contact => contact.DemarcheRechercheContact.map(c => c.DemarcheContact)).flat().filter(contact => {
    if (!idSet.has(contact.idContact)) {
      idSet.add(contact.idContact)
      return true
    }
    return false
  })

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
