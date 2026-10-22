import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'

const loginSchema = z.object({
  login: z.string().trim().min(1, 'Le login doit faire au minimum 1 caratère'),
  oldPassword: z.string().trim().min(1, 'Le mot de passe doit faire au minimum 8 caratère'),
  newPassword: z.string().trim().min(1, 'Le mot de passe doit faire au minimum 8 caratère')
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
  await clearUserSession(event)

  return { success: true }
})
