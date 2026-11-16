<script setup lang="ts">
import CompanyStudentSearchTable from '~/components/companies/CompanyStudentSearchTable.vue';
import UserRole from '~~/shared/types/role'

definePageMeta({
  path: '/companies/:id(\\d+)/student-search',
  middleware: ['auth', 'role'],
  role: UserRole.Secretary
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`Liste des étudiants ayant postulé`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
        <CompanyStudentSearchTable :idEntreprise="$route.params.id as string" />
    </template>
  </UDashboardPanel>
</template>
