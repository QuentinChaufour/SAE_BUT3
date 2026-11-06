import { prisma } from '~~/server/utils/prisma'
import UserRole from '~~/shared/types/role'
import { checkAuth } from '~~/server/utils/middleware'

interface DepartmentData {
  Departement: {
    idDepartement: number
    nom: string
    anneeActuelle: string | null
  }
}

defineRouteMeta({
  openAPI: {
    tags: ['me'],
    description: 'Récupère les informations du personnel connecté (hors admin).',
    responses: {
      200: {
        description: 'Les informations du personnel connecté.',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  annee: { type: 'string', description: 'Année de l\'inscription' },
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
      },
      403: { description: 'Forbidden' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await checkAuth(event, [UserRole.Teacher, UserRole.Secretary])

  const departments = session.user.role === UserRole.Teacher
    ? await getTeachersDepartments(session.user.numId)
    : await getPersonnelsDepartments(session.user.numId)

  const formattedDepartments = departments.map(async (appartenance) => {
    const rawYears = await prisma.inscription.findMany({
      where: {
        Formation: { idFormation: appartenance.Departement.idDepartement },
        RechercheStage: { some: {} }
      },
      select: { annee: true },
      distinct: ['annee'],
      orderBy: { annee: 'desc' }
    })

    const years = rawYears.map(inscription => inscription.annee)
    if (appartenance.Departement.anneeActuelle && !years.includes(appartenance.Departement.anneeActuelle)) {
      years.push(appartenance.Departement.anneeActuelle)
    }

    return {
      annees: years,
      departement: {
        id: appartenance.Departement.idDepartement,
        nom: appartenance.Departement.nom
      }
    } satisfies APIConnectedPersonnel
  })

  const data: APIConnectedPersonnel[] = await Promise.all(formattedDepartments)
  return data
})

async function getPersonnelsDepartments(numPersonnel: string): Promise<DepartmentData[]> {
  const personnelsDepartments = await prisma.appartenir.findMany({
    where: { numPersonnel },
    select: { Departement: { select: { idDepartement: true, nom: true, anneeActuelle: true } } }
  })
  return personnelsDepartments
}

async function getTeachersDepartments(numPersonnel: string): Promise<DepartmentData[]> {
  const teachersDepartments = await prisma.anneeEnseignant.findMany({
    where: { numEnseignant: numPersonnel },
    select: { Departement: { select: { idDepartement: true, nom: true, anneeActuelle: true } } }
  })
  return teachersDepartments
}
