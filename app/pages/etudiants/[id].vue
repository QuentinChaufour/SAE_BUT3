<script setup lang="ts">

definePageMeta({
  middleware: ['auth']
})

//---------- Routage ----------//

  import { useRoute } from 'vue-router'
  const route = useRoute()


//---------- Const ----------//

  const id = route.params.id
  const etuid = id //change


//---------- Interfaces ----------//

interface Stage {
  TuteurEntreprise: {
      Entreprise: {
      idEntreprise: number,
      siret: string,
      telephone: string,
      email: string,
      ville: string,
      codePostal: string,
      adresse: string,
      nom: string,
    }
    idEntreprise: number,
    idTuteurEntreprise: number,
    email: string,
    telephone: string,
    prenom: string,
    nom: string,
  }
  Enseignant: {
    email: string,
    prenom: string,
    nom: string,
    numEnseignant: string,
  };
  Etudiant: {
    numEtu: string,
    nom: string,
    prenom: string,
    email: string,
  }
  idStage: number;
  annee: string;
  confidentielle: boolean;
  dateDebut: string;
  dateFin: string;
  description: string;
  idTuteurEntreprise: number;
  numEnseignant: string;
  numEtu: string;
  titre: string;
  type: string;
}


//---------- Data & fetch ----------//  stage en fonction d'un etu et d'une année

const leStage = ref<{leStage: Stage[]}>({ leStage: []});
const stage = ref<Stage[]>([]);

async function load() {
  try {
    const data = await $fetch<{leStage: Stage[]}>(`/api/etu/stage`, {
      query: { elem: etuid }
    });

    leStage.value = data;
    stage.value = leStage.value.leStage;

  }
  catch (err){
    console.error(err);
  }
}

await load();

</script>

<template>
  <p>2</p>
</template>
