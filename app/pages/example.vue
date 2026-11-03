<script setup lang="ts">
import UserRole from '~~/shared/types/role'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
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
