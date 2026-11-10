<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import DataTable from '~/components/common/DataTable.vue'
import type { Entreprise } from '~~/generated/prisma/client'

const props = defineProps<{
  idEntreprise: number
}>()

const store = useConnectedPersonnelStore()

const { data: companies } = useFetch<Entreprise[]>(`/api/companies/${props.idEntreprise}/student-search/${store.getSelectedDepartment?.departement.id}?year=${store.getCurrentYear}`)

const searchFields = (company: Entreprise) => [company.nom, company.nomEtab]

const columns: TableColumn<Entreprise>[] = [
  {
    id: 'nom',
    accessorFn: row => [row.nom, row.nomEtab].filter(Boolean).join(' - '),
    header: 'Nom'
  },
  {
    id: 'ville',
    accessorFn: row => row.ville,
    header: 'Ville',
    cell: ({ row }) => row.original.ville ?? 'N/A'
  },
  { id: 'action' }
]
</script>

<template>
  <div>
    <DataTable
      :data="companies"
      :columns="columns"
      :search-fields="searchFields"
      search-placeholder="Rechercher..."
      :page-size="5"
      sortable
    >
      <template #action-cell="{ row }">
        <UButton
          icon="i-heroicons-chevron-right"
          color="neutral"
          variant="ghost"
          aria-label="Voir"
        />
      </template>
    </DataTable>
  </div>
</template>
