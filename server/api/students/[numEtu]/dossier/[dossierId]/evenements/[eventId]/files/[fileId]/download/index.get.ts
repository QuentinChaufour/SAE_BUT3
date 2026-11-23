import { z } from 'zod/v4'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
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

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student, UserRole.Admin, UserRole.Secretary])

  const { uploadDir } = useRuntimeConfig(event)

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

  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)
  setResponseHeader(event, 'Content-Type', eventFile.type || 'application/octet-stream')
  setResponseHeader(event,'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'Content-Length', eventFile.taille || fileStat.size)

  return await sendStream(event, createReadStream(eventFile.chemin))
})
