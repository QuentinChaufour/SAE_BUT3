<script setup lang="ts">
import EtuList from '~/components/common/EtuList.vue'

definePageMeta({
  middleware: ['auth']
})

//---------- Const de pagination ----------//

const page = ref(1)
const itemsPerPage = ref(20)
const total = ref(500)


//---------- Interfaces ----------//

interface Stage {
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

interface Enseignant {
  email: string,
  prenom: string,
  nom: string,
  numEnseignant: string,
}

interface Etudiant {
  numEtu: string,
  nom: string,
  prenom: string,
  email: string,
}

interface Entreprise {
  idEntreprise: number,
  siret: string,
  telephone: string,
  email: string,
  ville: string,
  codePostal: string,
  adresse: string,
  nom: string,
}


//---------- Data & fetch ----------//

const lesStages = ref<{listStage: Stage[], listProf: Enseignant[], listEtu: Etudiant[], listEntreprise: Entreprise[]}>({ listStage: [], listProf: [], listEtu: [], listEntreprise: []});
const stages = ref<Stage[]>([]);
const profs = ref<Enseignant[]>([]);
const etus = ref<Etudiant[]>([]);
const entreprises = ref<Entreprise[]>([]);

async function load(pageVal: number) {
  try {
    const data = await $fetch<{listStage: Stage[], listProf: Enseignant[], listEtu: Etudiant[], listEntreprise: Entreprise[]}>(`/api/etu/etu-list`, {
      query: { page: pageVal }
    });

    lesStages.value = data;
    stages.value = lesStages.value.listStage;
    profs.value = lesStages.value.listProf;
    etus.value = lesStages.value.listEtu;
    entreprises.value = lesStages.value.listEntreprise;
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
        <p>None</p>
        <p>None</p>
      </div>

      <USeparator class="mb-3 mt-3"/>
      <div v-for="(item, index) in stages" class="pt-5 p-3">
        <EtuList
          :annee="item?.annee"
          :Tuteur="{
            nom: profs[index]?.nom ?? '',
            prenom: profs[index]?.prenom[0] ?? '',
          }"
          :Etu="{
            nom: etus[index]?.nom ?? '',
            prenom: etus[index]?.prenom[0] ?? '',
          }"
          :entreprise="entreprises[index]?.nom"
        />
      </div>

      <USeparator class="mb-3 mt-3"/>
        <UPagination v-model:page="page" :items-per-page="itemsPerPage" :total="total" show-edges :sibling-count="1"  @click="update"/>
    </div>

    </UDashboardPanel>
  </template>
