<script setup lang="ts">
import AddPersonnelModal from '~/components/personnels/AddPersonnelModal.vue'
import PersonnelsTable from '~/components/personnels/PersonnelsTable.vue'
import UserRole from '~~/shared/types/role'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Admin
})

const personnelsTable = useTemplateRef('personnelsTable')
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Administrateurs">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <AddPersonnelModal
            :type="'admin'"
            @created="personnelsTable?.refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <PersonnelsTable
        ref="personnelsTable"
        :type="'admin'"
      />
    </template>
  </UDashboardPanel>
</template>
