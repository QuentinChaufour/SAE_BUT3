import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {

  const query = getQuery(event);
  const page = Number(query.page ?? 1);
  const skpElem = (page - 1) * 20;

  const stages = await prisma.stage.findMany({
    skip: skpElem,
    take: 20, // Take the next 20 elements

    // Comditions a rajouter plus tard avec les filtres
    // where: {
    //   login: body.login
    // },
    // include: {
    //   Enseignant: true,
    //   Etudiant: true,
    //   Personnel: true
    // }
  })
  const profs = await prisma.enseignant.findMany({});
  const etus = await prisma.etudiant.findMany({});
  const entreprises = await prisma.entreprise.findMany({});

  if (!stages) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Stage not found'
    })
  }

  if (!profs) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Prof not found'
    })
  }

  if (!etus) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Etudiant not found'
    })
  }

  if (!entreprises) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Entreprise not found'
    })
  }

  return { listStage: stages, listProf: profs, listEtu: etus , listEntreprise: entreprises }
})
