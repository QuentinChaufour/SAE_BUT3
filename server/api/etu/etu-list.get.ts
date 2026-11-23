import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {

  const query = getQuery(event);
  const page = Number(query.page ?? 1);
  const skpElem = (page - 1) * 20;

  const stages = await prisma.stage.findMany({
    skip: skpElem,
    take: 20, // Take the next 20 elements

    include: {
      TuteurEntreprise: {
        include: {
          Entreprise: true,
        }
      },
      Enseignant: true,
      AnneeUniversitaire: true,
      Etudiant: true
    }

    // Comditions a rajouter plus tard avec les filtres
    // where: {
    //   login: body.login
    // },
  })

  if (!stages) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Stage not found'
    })
  }

  return { listStage: stages }
})
