import { z } from 'zod/v4'
import { stat, unlink } from 'node:fs/promises'
import { basename } from 'node:path'
import { prisma } from '~~/server/utils/prisma'
import { dossierIdSchema, eventIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

const routeSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema,
  eventId: eventIdSchema,
  fileId: z.string().trim().regex(/^\d+$/, 'L\'identifiant du fichier doit être un nombre').transform(Number)
})

export default defineEventHandler(async (event) => {
  const { numEtu, dossierId, eventId, fileId } = await getValidatedRouterParams(event, routeSchema.parse)

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])

  const eventFile = await prisma.lienPj.findFirst({
    where: {
      idDemarche: eventId,
      idRecherche: dossierId,
      idPieceJointe: fileId
    },
    select: {
      PieceJointe: {
        select: {
          nom: true,
          chemin: true,
          type: true,
          taille: true
        }
      }
    }
  }).then(async (lienPj) => { return {
    nom: lienPj?.PieceJointe.nom,
    chemin: lienPj?.PieceJointe.chemin,
    type: lienPj?.PieceJointe.type,
    taille: lienPj?.PieceJointe.taille
  }})

  if (!eventFile?.chemin || !eventFile?.nom) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }
  const fileStat = await stat(eventFile.chemin).catch(() => null)

  if (!fileStat || !fileStat.isFile()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }

  const fileName = basename(eventFile.nom!)

  try{
    await unlink(eventFile.chemin)

    await prisma.$transaction(async (prisma) => {
     await prisma.lienPj.delete({
       where: {
         idPieceJointe_idDemarche: {
           idDemarche: eventId,
           idPieceJointe: fileId
         },
         idRecherche: dossierId,
       }
     })

     await prisma.pieceJointe.delete({
       where: {
         idPieceJointe: fileId
       }
     })
    })

    return {
      statusCode: 204,
      statusMessage: `File: ${fileName} deleted successfully`
    }
  }
  catch{
    throw createError({
      statusCode: 500,
      statusMessage: `Error deleting file: ${fileName}`
    })
  }
  
})
