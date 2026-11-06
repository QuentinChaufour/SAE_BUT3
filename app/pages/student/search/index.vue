<script setup lang="ts">
import CreateSearchModal from '~/components/student/search/CreateSearchModal.vue'
import StudentSearchTable from '~/components/student/search/StudentSearchTable.vue'
import UserRole from '~~/shared/types/role'

const session = useUserSession()
const store = useConnectedStudentStore()

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
})
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
        :num-etu="session.user.value!.numId"
        :id-inscription="store.getSelectedPromotion!.idInscription"
        :read-only="store.isReadOnlyYear"
      />
    </template>
  </UDashboardPanel>
</template>
