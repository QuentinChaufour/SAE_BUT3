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


//---------- Tabs change ----------//

import type { TabsItem } from '@nuxt/ui'

const items = ref<TabsItem[]>([
  {
    label: 'Recherche de stage',
    content: 'Empty',
    slot: 'stage' as const,
  },
  {
    label: 'Soutenance',
    content: 'Empty',
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
      <p class="ml-5 pt-3 font-semibold">{{ stage[0]?.Etudiant.prenom ?? '' }} {{ (stage[0]?.Etudiant.nom ?? '').toUpperCase() }}</p>

      <div class="basis-full mt-5">
        <UButton color="neutral">BUT3 Informatique</UButton>
      </div>
    </div>

    <UTabs :items="items" class="p-5">
      <template #stage="{ item }">
        <!-- Ici attendre d'avoir la partie recherche de stage finit pour l'integrer -->
      </template>

      <template #soutenance="{ item }">

        <UFormField class="mb-3" label="Titre" name="current" required>
          <UInput placeholder="Titre du stage" type="text" class="w-full" required />
        </UFormField>

        <UFormField class="mb-3" label="Description" name="new" required>
          <UInput placeholder="Description du stage" type="text" class="w-full" required />
        </UFormField>

        <div class="flex w-full gap-3">
          <UFormField class="mb-3 w-full" label="Durée" name="new" >
            <UInput placeholder="X semaines" type="text" class="w-full" />
          </UFormField>
          <UFormField class="mb-3 w-full" label="Maitre de stage" name="new" >
            <UInput placeholder="M. NOM" type="text" class="w-full" />
          </UFormField>
        </div>

        <USeparator class="mb-6 mt-3"/>

        <!-- Ici mettre la bordure orange en fonction de celui concerné. Si il y a un tuteur, mettre le 1er en orange et le 2eme en gris, sinon, rien sur le 1er et le 2eme en orange -->
        <div class="flex p-5 m-3 items-center justify-between">
          <div>
            <p><b>Tuteur universitaire</b></p>
            <p class="text-mist-500/75">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
          </div>
          <div>
            <UButton color="error">Non définit</UButton> <!-- Mettre le nom du tuteur si il existe -->
          </div>
        </div>

        <div class="flex p-5 m-3 border border-solid rounded-lg border-orange-500 bg-orange-200/45 items-center justify-between">
          <div>
            <p><b>Tuteur universitaire non défini</b></p>
            <p class="text-mist-500/75">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
          </div>
          <div>
            <UButton color="info">Me proposer</UButton> <!-- Mettre le nom du tuteur si il existe -->
          </div>
        </div>

      </template>
    </UTabs>

    </UDashboardPanel>
  </template>
