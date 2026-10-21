<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <UDashboardPanel>
    <UDashboardNavbar :title="'Titre de la page'">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardNavbar>
  </UDashboardPanel>
</template>
