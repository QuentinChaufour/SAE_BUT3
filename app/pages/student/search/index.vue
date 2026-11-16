<script setup lang="ts">
import CreateSearchModal from '~/components/student/search/CreateSearchModal.vue'
import StudentSearchTable from '~/components/student/search/StudentSearchTable.vue'
import type { RechercheStage } from '~~/generated/prisma/client'
import UserRole from '~~/shared/types/role'

const session = useUserSession()
const store = useConnectedStudentStore()

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
})

function onCreateSearch(search: RechercheStage) {
  navigateTo(`/student/dossier/${search.idRecherche}`)
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="'Recherche de stages'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CreateSearchModal @created="onCreateSearch" />
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
