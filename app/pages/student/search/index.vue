<script setup lang="ts">
import CreateSearchModal from '~/components/student/search/CreateSearchModal.vue'
import StudentSearchTable from '~/components/student/search/StudentSearchTable.vue'
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="'Recherche de stages'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CreateSearchModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <StudentSearchTable
        :etudiant-id="'o22401314'"
      />
    </template>
  </UDashboardPanel>
</template>
