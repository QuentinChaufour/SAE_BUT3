import { z } from 'zod/v4'
import { studentIdSchema } from '~~/shared/schemas/student'
import { prisma } from '~~/server/utils/prisma'

const routeSchema = z.object({
  studentId: studentIdSchema
})

export default defineEventHandler(async (event) => {

  const { studentId } = routeSchema.parse(event.context.params)

  // Get the department ID of the student
  const departementId = await prisma.etudiant.findFirst({
    where: {
      numEtu: studentId
    },
    select: {
      Inscription: {
        select: {
          Formation: {
            select: {
              idDepartement: true
            }
          }
        }
      }
    }
  })

  if(!departementId || !departementId.Inscription || departementId.Inscription.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Departement not found for the given studentId'
    })
  }

  const departement = await prisma.departement.findUnique({
    where: {
      idDepartement: departementId.Inscription[0]?.Formation.idDepartement
    }
  })

  return {
    statusCode: 200,
    data: departement
  } 
})
