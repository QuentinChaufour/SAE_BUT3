import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma';

const loginSchema = z.object({
  // TODO check "o" -> students , "p" -> teacher etc ... => login credential required
  login: z.string().min(1, 'must be at least 1 character long'),
  oldPassword: z.string().min(1, 'must be at least 1 character long'),
  newPassword: z.string().min(1, 'must be at least 1 character long')
}).refine(
  ({ oldPassword, newPassword }) => oldPassword !== newPassword,
  {
    path: ['newPassword'],
    message: 'new password must differ from old password'
  }
)

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

  const oldHashedPassword = await hashPassword(body.oldPassword);
  const hashedPassword = await hashPassword(body.newPassword);

  const user = await prisma.auth.findFirst({
    where: {
      login: body.login
    }
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })
  }

  const result = await verifyPassword(oldHashedPassword, user.password!);

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
  });

  return { success: true }
})
