<script setup lang="ts">
import { UBreadcrumb } from '#components'
import CompanyStudentSearchTable from '~/components/companies/CompanyStudentSearchTable.vue'
import UserRole from '~~/shared/types/role'

definePageMeta({
  path: '/companies/:id(\\d+)/student-search',
  middleware: ['auth', 'role'],
  role: [UserRole.Secretary, UserRole.Teacher]
})

const route = useRoute()
const { data: company } = await useFetch<{ nom: string }>(`/api/companies/${route.params.id}`)

const companyName = computed(() => company.value?.nom)
const breadcrumbs = computed(() => [
  { label: 'Entreprises', to: '/companies' },
  { label: `${companyName.value ?? 'Entreprise inconnue'} > Liste des étudiants ayant postulé` }
])
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBreadcrumb :items="breadcrumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <CompanyStudentSearchTable
        :id-entreprise="$route.params.id as string"
      />
    </template>
  </UDashboardPanel>
</template>
