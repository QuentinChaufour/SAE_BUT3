import { z } from 'zod/v4'
import { dossierIdSchema } from '~~/shared/schemas/dossier'

const paramsSchema = z.object({
  dossierId: dossierIdSchema
})

export default defineEventHandler(async (event) => {
  const { dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)

  // récupérer le dossier de recherche
  const dossier = await prisma.rechercheStage.findUnique({
    select: {
      idRecherche: true,
      description: true,
      titre: true,
      alternance: true,
      Entreprise: {
        select: {
          nom: true,
          adresse: true,
          codePostal: true,
          ville: true
        }
      },
      DemarcheEvenement: {
        select: {
          idDemarche: true,
          date: true,
          description: true,
          titre: true,
          status: true,
          source: true,
          LienPj: {
            select: {
              PieceJointe: {
                select: {
                  idPieceJointe: true,
                  nom: true
                }
              }
            }
          },
          DemarcheRechercheContact: {
            select: {
              DemarcheContact: true
            },
          }
        },
        orderBy: {
          date: 'desc'
        }
      },
      DepartementTagRecherche: {
        select: {
          DepartementTag: true
        }
      }
    },
    where: {
      idRecherche: dossierId
    }
  })

  if (!dossier) {
    return sendError(event, createError({
      statusCode: 404,
      statusMessage: 'Dossier not found'
    }))
  }
  
  return { 
    statusCode: 200,
    data: dossier
  }
})
