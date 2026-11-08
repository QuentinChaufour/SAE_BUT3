import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import { dossierIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const paramsSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId } = await getValidatedRouterParams(event, paramsSchema.parse)
  
  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student, UserRole.Secretary, UserRole.Teacher, UserRole.Admin])
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
            }
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
      message: 'Dossier not found'
    }))
  }

  return {
    statusCode: 200,
    data: dossier
  }
})
