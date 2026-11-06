import { email } from "zod/v4";

export default defineEventHandler(async () => {
  // Sécurité : jamais en production
  if (!import.meta.dev) {
    throw createError({ statusCode: 404 });
  }
  // const anneeBD = await prisma.anneeUniversitaire.create({
  //   data: {
  //     annee: "2026",
  //   },
  // });

  // const newSoutenance = await prisma.soutenance.create({
  //   data: {
  //     idSalle: ,
  //     annee: ,
  //     dateFin: ,
  //     dateDebut: ,
  //   },
  // });

  const stageBD = await prisma.stage.create({
    data: {
      confidentielle: false,
      idTuteurEntreprise: 3, //
      idStage: 3,
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      numEnseignant: null, //
      annee: "2026", //
      numEtu: "o22403492", //
      titre: "Stage Développeur Full-Stack (Java / React)",
      dateFin: new Date("2026-06-20"),
      dateDebut: new Date("2026-04-06"),
      type: "stage",
    },
  });

  return stageBD;
});
