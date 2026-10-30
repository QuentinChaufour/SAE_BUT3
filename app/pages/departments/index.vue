<script setup lang="ts">
import CreateDepartmentModal from '~/components/departments/CreateDepartmentModal.vue'
import DepartmentsTable from '~/components/departments/DepartmentsTable.vue'
import UserRole from '~~/shared/types/role'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Admin
})

function handleEdit(department: { idDepartement: number, nom: string }) {
  return navigateTo(`/departments/${department.idDepartement}/`)
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="'Départements'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CreateDepartmentModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <DepartmentsTable @edit="handleEdit" />
    </template>
  </UDashboardPanel>
</template>
