<script setup lang="ts">
import DepartmentModal from '~/components/departments/DepartmentModal.vue'
import DepartmentsTable from '~/components/departments/DepartmentsTable.vue'
import UserRole from '~~/shared/types/role'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Admin
})

function handleSecretariats(department: { idDepartement: number, nom: string }) {
  return navigateTo(`/departments/${department.idDepartement}/secretariats`)
}

const departmentsTable = useTemplateRef('departmentsTable')
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="'Départements'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <DepartmentModal @saved="departmentsTable?.refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <DepartmentsTable
        ref="departmentsTable"
        @secretariats="handleSecretariats"
      />
    </template>
  </UDashboardPanel>
</template>
