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


//---------- Tabs change ----------//

import type { TabsItem } from '@nuxt/ui'

const items = ref<TabsItem[]>([
  {
    label: 'Recherche de stage',
    content: 'This is the account content.',
    slot: 'stage' as const,
  },
  {
    label: 'Soutenance',
    content: 'This is the password content.',
    slot: 'soutenance' as const,
  }
])
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar :title="'Etudiants'">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>

    <div class="rounded-md border border-mist-500/25 m-5 p-3 flex flex-wrap">
      <div>
        <UAvatar src="https://github.com/k3rr13n.png" size="3xl"/>
      </div>
      <p class="ml-5 pt-3 font-semibold">{{ stages[0]?.Etudiant.prenom ?? '' }} {{ (stages[0]?.Etudiant.nom ?? '').toUpperCase() }}</p>

      <div class="basis-full mt-5">
        <UButton color="neutral">BUT3 Informatique</UButton>
      </div>
    </div>

    <UTabs :items="items" class="p-5">
      <template #stage="{ item }">
        <p>Je suis le test</p>
      </template>

      <template #soutenance="{ item }">
        <UFormField class="mb-3" label="Titre" name="current" required>
          <UInput placeholder="Titre du stage" type="text" class="w-full" required />
        </UFormField>
        <UFormField class="mb-3" label="Description" name="new" required>
          <UInput placeholder="Description du stage" type="text" class="w-full" required />
        </UFormField>
        <!-- <UFormField label="Confirm Password" name="confirm" required>
          <UInput type="password" required class="w-full" />
        </UFormField> -->
      </template>
    </UTabs>

    </UDashboardPanel>
  </template>
