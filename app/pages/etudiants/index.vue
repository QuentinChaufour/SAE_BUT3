<script setup lang="ts">
import EtuList from '~/components/common/EtuList.vue'

definePageMeta({
  middleware: ['auth']
})

//---------- Const de pagination ----------//

const page = ref(1)
const itemsPerPage = ref(20)
const total = ref(500) // Valeur par défault


//---------- Interfaces ----------//

interface Stage {
  TuteurEntreprise: {
      Entreprise: {
      idEntreprise: number,
      siret: string | null,
      telephone: string | null,
      email: string | null,
      ville: string | null,
      codePostal: string | null,
      adresse: string | null,
      nom: string,
    }
    idEntreprise: number,
    idTuteurEntreprise: number,
    email: string | null,
    telephone: string | null,
    prenom: string | null,
    nom: string | null,
  }
  Enseignant: {
    email: string | null,
    prenom: string | null,
    nom: string | null,
    numEnseignant: string,
  }
  Etudiant: {
    numEtu: string,
    nom: string | null,
    prenom: string | null,
    email: string | null,
  }
  idStage: number;
  annee: string;
  confidentielle: boolean;
  dateDebut: string | null,
  dateFin: string | null,
  description: string | null,
  idTuteurEntreprise: number;
  numEnseignant: string | null,
  numEtu: string;
  titre: string | null,
  type: string | null,
}


//---------- Data & fetch ----------//

const lesStages = ref<{listStage: Stage[]}>({ listStage: []});
const stages = ref<Stage[]>([]);

async function load(pageVal: number) {
  try {
    const data = await $fetch<{listStage: Stage[]}>(`/api/etu/etu-list`, {
      query: { page: pageVal }
    });

    lesStages.value = data;
    stages.value = lesStages.value.listStage;

    total.value = Math.round(stages.value.length / 20) + 1 // Maj de la taille de la pagination
    // console.log(stages.value)
  }
  catch (err){
    console.error(err);
  }
}

async function update() {
  const pageUpdate = page.value;
  await load(pageUpdate);
}

await load(page.value);

</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar :title="'Etudiants'">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>

    <!-- Ajouter les filtres /!\ -->
    <div class="rounded-md border border-mist-500/25 m-5 p-3">
      <div class="grid grid-rows-1 grid-cols-6 p-2 font-bold">
        <p>Etudiant</p>
        <p>Année d'étude</p>
        <p>Entreprise</p>
        <p>Tuteur de stage</p>
        <p>Plus d'info</p>
      </div>

      <USeparator class="mb-3 mt-3"/>
      <div v-for="(item, index) in stages" class="pt-5 p-3">
        <EtuList
          :num-etu="item?.Etudiant.numEtu"
          :annee="item?.annee"
          :Tuteur="{
            nom: item?.Enseignant?.nom ?? '',
            prenom: item?.Enseignant?.prenom?.[0] ?? '',
          }"
          :Etu="{
            nom: item?.Etudiant?.nom ?? '',
            prenom: item?.Etudiant?.prenom?.[0] ?? '',
          }"
          :entreprise="item?.TuteurEntreprise.Entreprise.nom ?? ''"
        />
      </div>

      <USeparator class="mb-3 mt-3"/>
        <UPagination v-model:page="page" :items-per-page="itemsPerPage" :total="total" show-edges :sibling-count="1"  @click="update"/>
    </div>

    </UDashboardPanel>
  </template>
