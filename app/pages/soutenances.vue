<script setup lang="ts">
  import ClassCard from '~/components/soutenance/ClassCard.vue';
  import SoutenanceCard from '~/components/soutenance/SoutenanceCard.vue';
  import TableSoutenances from '~/components/soutenance/TableSoutenances.vue';

  const idDepartement: number = 1;

  type ApiClassData = {
    name: string | null;
    etudiants: number;
    stages: number;
    alternance: boolean;
  };

  type ClassData = Omit<ApiClassData, 'name'> & {
    name: string;
  };

    type ApiSoutenanceData = {
    name: string | null;
    alternance: boolean;
    stages: number;
    soutenances: number;
  };

  const classes = ref<ClassData[]>([]);
  const soutenances = ref<ApiSoutenanceData[]>([]);

  async function load(departement: number) {
    const data = await $fetch<ApiClassData[]>('/api/classes/summary/stages', {
      query: { idDepartement: departement }
    });

    classes.value = data.map(classData => ({
      ...classData,
      name: classData.name ?? 'Formation sans nom'
    }));

    const data2 = await $fetch<ApiSoutenanceData[]>('/api/classes/summary/soutenances', {
      query: { idDepartement: departement }
    });
    console.log(data2);

    soutenances.value = data2.map(soutenanceData => ({
      ...soutenanceData,
      name: soutenanceData.name ?? 'Formation sans nom'
    }));
  }

  await load(idDepartement);

</script>

<template>
  <UDashboardPanel :ui="{body:'m-0 sm:p-0 sm:pt-2 sm:pb-5 overflow-y-auto gap-2'}">
    <template #header>
      <UDashboardNavbar :title="'Tableau de bord'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UCard variant="outline" class="m-0 sm:m-3 md:m-4 shadow-md min-h-38 h-auto shrink-0" :ui="{body:'sm:pt-2 md:p-4 md:pb-1 sm:p-2'}">
        <p>Étudiants</p>
        <div class="md:flex">
          <ClassCard v-for="item in classes"
          :class_name=item.name
          :alternance=item.alternance
          :nb_etudiants=item.etudiants
          :nb_stages=item.stages
          class="mt-2"
          />
        </div>
      </UCard>

      <UCard variant="outline" class="m-0 sm:m-3 md:m-4 shadow-md min-h-38 h-auto shrink-0" :ui="{body:'sm:pt-2 md:p-4 md:pb-1 sm:p-2'}">
        <p>Soutenances</p>
        <div class="md:flex">
          <SoutenanceCard v-for="item in soutenances"
          :class_name=item.name
          :alternance=item.alternance
          :stages=item.stages
          :soutenances=item.soutenances
          />
        </div>
      </UCard>

      <UCard variant="outline" class="m-0 sm:m-3 md:m-4 shadow-md overflow-visible" :ui="{body:'sm:pt-1 sm:pb-1'}">
        <!-- <UTable sticky :data="enseignants" :columns="columns" class="max-h-100 overflow-auto whitespace-pre-line" /> -->
        <TableSoutenances :departementId="'1'"/>
      </UCard>
    </template>
  </UDashboardPanel>
</template>²
