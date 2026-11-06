import { z } from 'zod/v4'
import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'

const loginSchema = z.object({
  login: z.string().trim().min(1, 'Le login doit faire au minimum 1 caratère'),
  password: z.string().trim().min(8, 'Le mot de passe doit faire au minimum 8 caratère')
})

defineRouteMeta({
  openAPI: {
    tags: ['auth'],
    description: 'Authentifier un utilisateur et ouvrir sa session.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['login', 'password'],
            properties: {
              login: {
                type: 'string',
                description: 'Identifiant de connexion.'
              },
              password: {
                type: 'string',
                format: 'password',
                description: 'Mot de passe de l\'utilisateur.'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Connexion réussie.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true }
              }
            }
          }
        }
      },
      400: {
        description: 'Les identifiants fournis sont invalides.'
      },
      401: {
        description: 'Identifiant ou mot de passe incorrect.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

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

  const result = await verifyPassword(user.password, body.password)
  if (!result) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorised'
    })
  }

  const userSession = {
    numId: user.login,
    role: UserRole.Student,
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

    if (user.Personnel?.role === 'admin') {
      userSession.role = UserRole.Admin
    } else {
      userSession.role = UserRole.Secretary
    }
  }

  await setUserSession(event, {
    user: userSession
  })

  // TODO redirect on server side instead of client side ?

  return { success: true }
})
