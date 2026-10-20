import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

const loginSchema = z.object({
  login: z.string().min(1, 'must be at least 1 character long'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const hashedPassword = await hashPassword(body.password)

  const user = await prisma.auth.findFirst({
    where: {
      login: body.login
    },
    include: {
      Enseignant: true,
      Etudiant: true,
      Personnel: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })
  }

  const result = await verifyPassword(hashedPassword, user.password!)
  if (!result) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })
  }

  const userSession = {
    numId: user.login,
    role: '',
    nom: '',
    prenom: ''
  }

  // Détermine le rôle de l'utilisateur au sein de l'app
  if (user.Enseignant) {
    userSession.role = UserRole.Teacher
    userSession.nom = user.Enseignant?.nom || ''
    userSession.prenom = user.Enseignant?.prenom || ''
  } else if (user.Etudiant) {
    userSession.role = UserRole.Student
    userSession.nom = user.Etudiant?.nom || ''
    userSession.prenom = user.Etudiant?.prenom || ''
  } else {
    userSession.nom = user.Personnel?.nom || ''
    userSession.prenom = user.Personnel?.prenom || ''
    // TODO infer role by sting directly ?? maybe too dangerous in cas of changes
    if (user.Personnel?.role === 'admin') {
      userSession.role = UserRole.Admin
    } else {
      userSession.role = UserRole.Secretary
    }
  }

  await setUserSession(event, {
    user: userSession
  })

  return { success: true }
})
