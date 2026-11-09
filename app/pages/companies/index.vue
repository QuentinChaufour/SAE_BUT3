<script setup lang="ts">
import CompaniesSearchTable from '~/components/companies/CompaniesSearchTable.vue'
import CreateCompanyModal from '~/components/companies/CreateCompanyModal.vue'
import UserRole from '~~/shared/types/role'

definePageMeta({
  middleware: ['auth', 'role'],
  role: [UserRole.Secretary, UserRole.Teacher]
})

const isOpenCreateCompanyModal = ref(false)
const companiesTable = useTemplateRef('companiesTable')

const session = useUserSession()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Entreprises">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
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
            @company-created="() => companiesTable!.refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CompaniesSearchTable
        ref="companiesTable"
        :read-only="session.user?.value?.role !== UserRole.Secretary"
      />
    </template>
  </UDashboardPanel>
</template>
