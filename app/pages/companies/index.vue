<script setup lang="ts">
import CompaniesSearchTable from '~/components/companies/CompaniesSearchTable.vue'
import CreateCompanyModal from '~/components/companies/CreateCompanyModal.vue'
import EditCompanyModal from '~/components/companies/EditCompanyModal.vue'
import type { Entreprise } from '~~/generated/prisma/client'
import UserRole from '~~/shared/types/role'

definePageMeta({
  middleware: ['auth', 'role'],
  role: [UserRole.Secretary, UserRole.Teacher]
})

const isOpenCreateCompanyModal = ref(false)
const isOpenEditCompanyModal = ref(false)
const companyToEdit = ref<Entreprise | null>(null)
const companiesTable = useTemplateRef('companiesTable')

const session = useUserSession()

function openCompanyModal(company: Entreprise) {
  companyToEdit.value = company
  isOpenEditCompanyModal.value = true
}

function onCompanySaved() {
  companiesTable.value?.refresh()
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Entreprises">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template
          v-if="session.user?.value?.role === UserRole.Secretary"
          #right
        >
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            variant="solid"
            @click="isOpenCreateCompanyModal = true"
          >
            Ajouter
          </UButton>

          <CreateCompanyModal
            v-model:open="isOpenCreateCompanyModal"
            @created="() => companiesTable!.refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CompaniesSearchTable
        ref="companiesTable"
        :read-only="session.user?.value?.role !== UserRole.Secretary"
        @edit="openCompanyModal"
      />

      <EditCompanyModal
        v-model:open="isOpenEditCompanyModal"
        :edit-company="companyToEdit"
        :read-only="session.user?.value?.role !== UserRole.Secretary"
        @saved="onCompanySaved"
      />
    </template>
  </UDashboardPanel>
</template>
