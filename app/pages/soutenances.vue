<script setup lang="ts">
  import ClassCard from '~/components/soutenance/ClassCard.vue';
  import SoutenanceCard from '~/components/soutenance/SoutenanceCard.vue';
  import type { TableColumn } from '@nuxt/ui';

  async function load(departement: number) {
    try{
      const data = await $fetch(`/api/prof/profs-list-tuteur`, {
        query: { idDepartement: departement }
      });
      enseignants.value = data;
      console.log("Fetched data:", data);
    }
    catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  
  
  const classes = ref([
    {
      name: "BUT 1",
      etudiants: 100,
      stages: 10,
      alternances: 5
    },
    {
      name: "BUT 2",
      etudiants: 70,
      stages: 15,
      alternances: 20
    },
    {
      name: "BUT 3",
      etudiants: 90,
      stages: 20,
      alternances: 5
    }
  ]);

  const soutenances = ref([
    {
      name: "BUT 2",
      type: "stage",
      stages: 70,
      soutenances: 30
    },
    {
      name: "BUT 2",
      type: "alternance",
      stages: 10,
      soutenances: 6
    },
    {
      name: "BUT 3",
      type: "stage",
      stages: 45,
      soutenances: 26
    },
    {
      name: "BUT 3",
      type: "aleternance",
      stages: 8,
      soutenances: 3
    },
  ]);
  
  let enseignants = ref();
  await load(1);
  /*
  const enseignants = ref([
    {
      "Nom": "CHABIN Jacques",
      "Tuteur stage BUT 2": "10/10",
      "Tuteur alternance BUT 2": "2/3",
      "Tuteur stage BUT 3": "6/6",
      "Tuteur alternance BUT 3": "4/3",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
    {
      "Nom": "DALAIGRE Christophe",
      "Tuteur stage BUT 2": "64/10",
      "Tuteur alternance BUT 2": "0/6",
      "Tuteur stage BUT 3": "4/4",
      "Tuteur alternance BUT 3": "2/1",
    },
  ]);
  */
 
  const ratioPattern = /^[0-9]+\/[0-9]+$/;

  function setDataColor(value: unknown): string {
    const defaultColor: string = "text-neutral-600 dark:text-neutral-400";

    if (typeof value !== "string") {
      return defaultColor;
    }

    const match = value.match(ratioPattern);
    if (!match) {
      return defaultColor;
    }

    const parts = match[0].split("/");
    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);

    if(numerator / denominator < 1)
      return "text-red-500";
    else if(numerator / denominator > 1)
      return "text-yellow-500";
    return defaultColor;
  }

  function createRatioColumns<T extends Record<string, unknown>>(rows: T[]): TableColumn<T>[] {
    return Object.keys(rows[0] ?? {}).map((accessorKey) => ({
      accessorKey,
      header: accessorKey,
      meta: {
        class: {
          td: ({ getValue }) => setDataColor(getValue())
        }
      }
    }));
  }

  const columns = computed(() => createRatioColumns(enseignants.value));
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar :title="'Tableau de bord'">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
      <UCard variant="outline" class="m-10 mt-5 mb-0 shadow-md">
        <p>Étudiants</p>
        <div class="flex">
          <ClassCard v-for="item in classes"
          :class_name=item.name
          :nb_etudiants=item.etudiants
          :nb_stages=item.stages
          :nb_alternances=item.alternances
          />
        </div>
      </UCard>

      <UCard variant="outline" class="m-10 mt-5 mb-0 shadow-md">
        <p>Soutenances</p>
        <div class="flex">
          <SoutenanceCard v-for="item in soutenances"
          :class_name=item.name
          :type=item.type
          :stages=item.stages
          :soutenances=item.soutenances
          />
        </div>
      </UCard>

      <UCard variant="outline" class="m-10 mb-0 shadow-md">
        <p class="text-xl text-mist-950 dark:text-red-50 font-semibold">Enseignants</p>
        <UTable sticky :data="enseignants" :columns="columns" />
      </UCard>
  </UDashboardPanel>
</template>
