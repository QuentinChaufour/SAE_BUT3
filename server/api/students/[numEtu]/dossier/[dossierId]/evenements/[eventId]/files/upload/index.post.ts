import { z } from 'zod/v4'
import { dossierIdSchema, eventIdSchema } from '~~/shared/schemas/dossier'
import { studentIdSchema } from '~~/shared/schemas/student'
import { prisma } from '~~/server/utils/prisma'
import { checkAuthWithOnlySelfStudentData } from '~~/server/utils/middleware'
import UserRole from '~~/shared/types/role'

import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const routeSchema = z.object({
  numEtu: studentIdSchema,
  dossierId: dossierIdSchema,
  eventId: eventIdSchema
})

// TODO add validation for file type and size


export default defineEventHandler(async (event): Promise<APIResponse<EventFile[]>> => {
  const { numEtu, dossierId, eventId } = await getValidatedRouterParams(event, routeSchema.parse)

  await checkAuthWithOnlySelfStudentData(event, numEtu, [UserRole.Student])

  const { uploadDir } = useRuntimeConfig(event)
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'No file' })

  //await mkdir(uploadDir, { recursive: true })
  const saved: EventFile[] = []

  for (const part of parts) {
    if (part.name !== 'files' || !part.filename) continue

    const id = `${randomUUID()}${extname(part.filename).toLowerCase()}`
    await writeFile(join(uploadDir, id), part.data)
    saved.push({ 
      id,
      name: part.filename, 
      size: part.data.length, 
      type: part.type 
    })
  }

  // Save the uploaded files information in the database
  await prisma.$transaction(async (tx) => {
    for (const file of saved) {

      const pieceJointe = await tx.pieceJointe.create({
        data: {
          chemin: join(uploadDir, file.id),
          nom: file.name,
          taille: file.size,
          type: file.type,
        },
      })

      file.id = pieceJointe.idPieceJointe.toString()

      await tx.lienPj.create({
        data: {
          idDemarche: eventId,
          idRecherche: dossierId,
          idPieceJointe: pieceJointe.idPieceJointe,
        }
      })
    }
  })

  return { statusCode: 200, data: saved }
})
