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

  // const enseignantBD = await prisma.enseignant.create({
  //   data: {
  //     email: "jaques@prof.com",
  //     prenom: "Jaques",
  //     nom: "Chabin",
  //     numEnseignant: "p594217",
  //   },
  // });

  // const entrepriseBD = await prisma.entreprise.create({
  //   data: {
  //     idEntreprise: 3,
  //     siret: "562 130 568 02005",
  //     telephone: "07 21 34 98 97",
  //     email: "atos@orleans.com",
  //     ville: "Orleans",
  //     codePostal: "45000",
  //     adresse: "15 rue François Mitterant",
  //     nom: "Atos",
  //   },
  // });

  // const tuteurBD = await prisma.tuteurEntreprise.create({
  //   data: {
  //     idEntreprise: 3,
  //     idTuteurEntreprise: 3,
  //     email: "gerome@tuteur.com",
  //     telephone: "07 47 11 09 62",
  //     prenom: "Gerome",
  //     nom: "Martin",
  //   },
  // });

  // const user = await prisma.etudiant.create({
  //   data: {
  //     numEtu: "o22403492",
  //     nom: "Martinez",
  //     prenom: "Martino",
  //     email: "martino@etu.fr",
  //     Auth: {
  //       create: {
  //         login: "o22403492",
  //         password: await hashPassword("wxcvbnwx"),
  //       },
  //     },
  //   },
  //   include: { Auth: true },
  // });

  // const stageBD = await prisma.stage.create({
  //   data: {
  //     confidentielle: false,
  //     idTuteurEntreprise: 3, //
  //     idStage: 3,
  //     description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  //     numEnseignant: null, //
  //     annee: "2026", //
  //     numEtu: "o22403492", //
  //     titre: "Stage Développeur Full-Stack (Java / React)",
  //     dateFin: new Date("2026-06-20"),
  //     dateDebut: new Date("2026-04-06"),
  //     type: "stage",
  //   },
  // });

  const salleBD = await prisma.salle.create({
    data: {
      batiment: "informatique",
      nomSalle: "I-007",
    },
  });

  return salleBD;
});
