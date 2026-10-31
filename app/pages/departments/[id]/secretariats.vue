<script setup lang="ts">
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
  throw createError({ statusCode: 404, statusMessage: 'Unknown department' })
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`Département ${data?.nom}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p>page</p>
    </template>
  </UDashboardPanel>
</template>
