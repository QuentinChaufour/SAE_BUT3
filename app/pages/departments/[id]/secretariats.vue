<script setup lang="ts">
import { UBreadcrumb } from '#components'
import AddPersonnelModal from '~/components/personnels/AddPersonnelModal.vue'
import PersonnelsTable from '~/components/personnels/PersonnelsTable.vue'
import type { Departement } from '~~/generated/prisma/client'
import UserRole from '~~/shared/types/role'

definePageMeta({
  path: '/departments/:id(\\d+)/secretariats',
  middleware: ['auth', 'role'],
  role: UserRole.Admin
})

type DepartmentFetchData = Departement & {
  DepartementTag: {
    idTag: number
    nomTag: string
  }[]
}

const route = useRoute()

const { data } = await useFetch<DepartmentFetchData>(`/api/departments/${route.params.id}`)

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Unknown department', fatal: true })
}

const personnelsTable = useTemplateRef('personnelsTable')
const breadcrumbs = [
  { label: 'Départements', to: '/departments' },
  { label: 'Secrétariats', to: `/departments/${route.params.id}/secretariats` }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #trailing>
          <UBreadcrumb :items="breadcrumbs" />
        </template>

        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <AddPersonnelModal
            :type="'secretariat'"
            :department="data!"
            @created="personnelsTable?.refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- TODO: Ajouter tags départment -->
      <PersonnelsTable
        ref="personnelsTable"
        :type="'secretariat'"
        :department="data!"
      />
    </template>
  </UDashboardPanel>
</template>
