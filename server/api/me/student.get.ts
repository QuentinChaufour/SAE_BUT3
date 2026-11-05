import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

defineRouteMeta({
  openAPI: {
    tags: ['me'],
    description: 'Récupère les informations de l\'étudiant connecté.',
    responses: {
      200: {
        description: 'Les informations de l\'étudiant connecté.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idInscription: { type: 'number', description: 'Identifiant de l\'inscription' },
                  annee: { type: 'string', description: 'Année de l\'inscription' },
                  formation: {
                    type: 'object',
                    properties: {
                      idInscription: { type: 'number', description: 'Identifiant de l\'inscription' },
                      departement: {
                        type: 'object',
                        properties: {
                          id: { type: 'number', description: 'Identifiant du département' },
                          nom: { type: 'string', description: 'Nom du département' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await checkAuth(event, [UserRole.Student])

  const data = await prisma.inscription.findMany({
    where: { numEtu: session.user.numId },
    select: {
      idInscription: true,
      annee: true,
      Formation: {
        select: {
          nomFormation: true,
          Departement: { select: { nom: true, anneeActuelle: true } }
        }
      }
    }
  })

  return data.map(inscription => ({
    idInscription: inscription.idInscription,
    annee: inscription.annee,
    readOnly: inscription.annee !== inscription.Formation.Departement.anneeActuelle,
    formation: {
      nom: inscription.Formation.nomFormation,
      departement: inscription.Formation.Departement.nom
    }
  })) satisfies APIConnectedStudent[]
})
