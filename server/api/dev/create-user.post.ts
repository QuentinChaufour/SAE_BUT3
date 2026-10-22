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

  const enseignantBD = await prisma.enseignant.create({
    data: {
      email: "cricri@prof.com",
      prenom: "Thomas",
      nom: "Pinsard",
      numEnseignant: "p42659",
    },
  });

  const entrepriseBD = await prisma.entreprise.create({
    data: {
      idEntreprise: 2,
      siret: "345 130 488 00018",
      telephone: "04 59 65 12 16",
      email: "leclerc@paris.com",
      ville: "Paris",
      codePostal: "75001",
      adresse: "2 rue des petits herissons",
      nom: "E. Leclerc Paris",
    },
  });

  const tuteurBD = await prisma.tuteurEntreprise.create({
    data: {
      idEntreprise: 2,
      idTuteurEntreprise: 2,
      email: "gille@tuteur.com",
      telephone: "07 69 32 35 54",
      prenom: "Joan",
      nom: "Calis",
    },
  });

  const user = await prisma.etudiant.create({
    data: {
      numEtu: "o22403491",
      nom: "Gloua",
      prenom: "Donatien",
      email: "donatien@etu.fr",
      Auth: {
        create: {
          login: "o22403491",
          password: await hashPassword("qsdfghjk"),
        },
      },
    },
    include: { Auth: true },
  });

  const stageBD = await prisma.stage.create({
    data: {
      confidentielle: false,
      idTuteurEntreprise: 2, //
      idStage: 2,
      description: "Je suis la fleur",
      numEnseignant: "p42659", //
      annee: "2026", //
      numEtu: "o22403491", //
      titre: "Developpement d'application",
      dateFin: new Date("2026-06-20"),
      dateDebut: new Date("2026-04-06"),
      type: "stage",
    },
  });

  return stageBD;
});
