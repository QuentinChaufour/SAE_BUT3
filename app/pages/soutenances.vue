<script setup lang="ts">
  import ClassCard from '~/components/soutenance/ClassCard.vue';
  import SoutenanceCard from '~/components/soutenance/SoutenanceCard.vue';
  import type { TableColumn } from '@nuxt/ui';

  async function load(departement: number) {
    try{
      const data = await $fetch(`/api/teachers/list-quotas`, {
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
      name: "BUT 2",
      etudiants: 70,
      stages: 15,
      alternance: false
    },
    {
      name: "BUT 2",
      etudiants: 10,
      stages: 3,
      alternance: true
    },
    {
      name: "BUT 3",
      etudiants: 50,
      stages: 10,
      alternance: false
    },
    {
      name: "BUT 3",
      etudiants: 5,
      stages: 2,
      alternance: true
    }
  ]);

  const soutenances = ref([
    {
      name: "BUT 2",
      alternance: false,
      stages: 70,
      soutenances: 30
    },
    {
      name: "BUT 2",
      alternance: true,
      stages: 10,
      soutenances: 6
    },
    {
      name: "BUT 3",
      alternance: false,
      stages: 45,
      soutenances: 26
    },
    {
      name: "BUT 3",
      alternance: true,
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

  function sumColumnRatios<T extends Record<string, unknown>>(
    rows: T[],
    accessorKey: string
  ): string {
    const totals = rows.reduce(
      (sum, row) => {
        const [numeratorValue, denominatorValue] = String(row[accessorKey] ?? "")
          .split("/");
        const numerator = Number(numeratorValue ?? NaN);
        const denominator = Number(denominatorValue ?? NaN);

        if (Number.isFinite(numerator) && Number.isFinite(denominator)) {
          sum.numerator += numerator;
          sum.denominator += denominator;
        }

        return sum;
      },
      { numerator: 0, denominator: 0 }
    );

    return `${totals.numerator}/${totals.denominator}`;
  }

  function createRatioColumns<T extends Record<string, unknown>>(rows: T[]): TableColumn<T>[] {
    return Object.keys(rows[0] ?? {}).map((accessorKey) => ({
      accessorKey,
      header: accessorKey === "Nom"
        ? accessorKey
        : `${accessorKey} \n${sumColumnRatios(rows, accessorKey)}`,
      meta: {
        class: {
          td: ({ getValue }: { getValue: () => unknown }) => setDataColor(getValue())
        }
      }
    }));
  }

  const columns = computed(() => createRatioColumns(enseignants.value));
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="'Tableau de bord'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard variant="outline" class="m-10 mt-3 mb-0 pb-3 shadow-md">
        <p>Étudiants</p>
        <div class="flex">
          <ClassCard v-for="item in classes"
          :class_name=item.name
          :alternance=item.alternance
          :nb_etudiants=item.etudiants
          :nb_stages=item.stages
          />
        </div>
      </UCard>

      <UCard variant="outline" class="m-10 mt-3 mb-0 pb-3 shadow-md">
        <p>Soutenances</p>
        <div class="flex">
          <SoutenanceCard v-for="item in soutenances"
          :class_name=item.name
          :alternance=item.alternance
          :stages=item.stages
          :soutenances=item.soutenances
          />
        </div>
      </UCard>

      <UCard variant="outline" class="m-10 mt-3 mb-0 shadow-md">
        <p class="text-xl text-mist-950 dark:text-red-50 font-semibold">Enseignants</p>
        <UTable sticky :data="enseignants" :columns="columns" class="max-h-100 overflow-auto whitespace-pre-line" />
      </UCard>
    </template>
  </UDashboardPanel>
</template>
