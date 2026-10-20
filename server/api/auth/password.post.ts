import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'

const loginSchema = z.object({
  login: z.string().min(1, 'must be at least 1 character long'),
  oldPassword: z.string().min(1, 'must be at least 1 character long'),
  newPassword: z.string().min(1, 'must be at least 1 character long')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const hashedPassword = await hashPassword(body.newPassword)

  const user = await prisma.auth.findFirst({
    where: {
      login: body.login
    }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })
  }

  const result = await verifyPassword(user.password, body.oldPassword)

  if (!result) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })
  }

  await prisma.auth.update({
    where: {
      login: user.login
    },
    data: {
      password: hashedPassword
    }
  })

  // Supprimer la session de l'utilisateur pour forcer la reconnexion
  await clearUserSession(event);

  return { success: true }
})
