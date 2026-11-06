import { checkAuth } from '~~/server/utils/middleware'
import { prisma } from '~~/server/utils/prisma'
import { companyFields } from '~~/shared/schemas/company.ts'
import UserRole from '~~/shared/types/role'

defineRouteMeta({
  openAPI: {
    tags: ['companies'],
    description: 'Créer une nouvelle entreprise.',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['nom', 'adresse', 'ville', 'pays'],
            properties: {
              nom: {
                type: 'string',
                description: 'Nom de l\'entreprise (2 a 100 caracteres).'
              },
              nomEtab: {
                type: 'string',
                nullable: true,
                description: 'Nom de l\'etablissement, facultatif (100 caracteres maximum).'
              },
              adresse: {
                type: 'string',
                description: 'Adresse de l\'entreprise (200 caracteres maximum).'
              },
              codePostal: {
                type: 'string',
                nullable: true,
                description: 'Code postal (10 caracteres maximum), obligatoire et compose de 5 chiffres en France.'
              },
              ville: {
                type: 'string',
                description: 'Ville de l\'entreprise (100 caracteres maximum).'
              },
              siret: {
                type: 'string',
                nullable: true,
                description: 'Numero SIRET de 14 caracteres, facultatif.'
              },
              pays: {
                type: 'string',
                description: 'Pays de l’entreprise (100 caracteres maximum).'
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'L\'entreprise creee.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                idEntreprise: { type: 'number' },
                nom: { type: 'string' },
                nomEtab: { type: 'string', nullable: true },
                adresse: { type: 'string' },
                codePostal: { type: 'string', nullable: true },
                ville: { type: 'string' },
                siret: { type: 'string', nullable: true },
                pays: { type: 'string', nullable: true }
              }
            }
          }
        }
      },
      403: {
        description: 'Forbidden'
      },
      400: {
        description: 'Les données fournies sont invalides.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkAuth(event, [UserRole.Student])

  const body = await readValidatedBody(event, companyFields.parse)
  const created = await prisma.entreprise.create({
    data: {
      nom: body.nom,
      nomEtab: body.nomEtab,
      adresse: body.adresse,
      codePostal: body.codePostal,
      ville: body.ville,
      siret: body.siret,
      pays: body.pays
    }
  })
  return created
})
