import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {

  const query = getQuery(event);
  const etu = String(query.elem);
  // const currentYear = String(query.year);

  const latestYear = await prisma.anneeUniversitaire.findFirst({
    orderBy: {
      annee: 'desc',
    },
  })

  if (!latestYear) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Year not found'
    })
  }

  const stage = await prisma.stage.findMany({
    where : {
      numEtu: etu,
      annee: latestYear.annee,
    },

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
  })

  if (!stage) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Stage not found'
    })
  }

  return { leStage: stage }
})
