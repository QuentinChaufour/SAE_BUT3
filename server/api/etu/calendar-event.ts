import { email } from "zod/v4";

export default defineEventHandler(async () => {

  // const newSoutenance = await prisma.soutenance.create({
  //   data: {
  //     idSalle: ,
  //     annee: ,
  //     dateFin: ,
  //     dateDebut: ,
  //   },
  // });

  // const newSoutenanceStage = await prisma.soutenanceStage.create({
  //   data: {
  //     idStage: ,
  //     idSoutenance: ,
  //   },
  // });

  // const newSoutenanceProf = await prisma.enseignantSoutenance.create({
  //   data: {
  //     idStage: ,
  //     idSoutenance: ,
  //   },
  // });

//   async function changeThat(payload: FormSubmitEvent<Schema>) {   // fonction de fetch
//   let response: LoginResponse

//   try {
//     response = await $fetch<LoginResponse>(`/api/etu/calendar-event`, {
//       method: 'POST',
//       body: { salle: '', annee: '', dateFin: '', dateDebut: '' }
//     })

//     if ('success' in response && response.success) {
//       toaster.add({
//         color: 'success',
//         title: 'Connexion réussi !'
//       })

//       // TODO redirect the user to a main page based on his role
//       await navigateTo('/example')
//     }
//   } catch {
//     toaster.add({
//       color: 'error',
//       title: 'Connexion échoué !'
//     })
//   }
// }

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
