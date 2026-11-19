<script setup lang="ts">
import { UBadge } from '#components'
import type { TableColumn } from '@nuxt/ui'
import DataTable from '~/components/common/DataTable.vue'
import StatusBadge from '~/components/dossier/StatusBadge.vue'
import type { Etudiant, Formation, RechercheStage } from '~~/generated/prisma/client'
import { DetailStatus } from '~/utils/RechercheStatusDetails'

const props = defineProps<{
  idEntreprise: string
}>()

const store = useConnectedPersonnelStore()

type CompanyStudentSearch = Pick<RechercheStage, 'idRecherche' | 'dateCreation' | 'titre' | 'status'> & {
  Inscription: {
    Formation: Pick<Formation, 'nomFormation'>
    Etudiant: Pick<Etudiant, 'nom' | 'prenom'>
  }
}

const { data: companies } = useFetch<CompanyStudentSearch[]>(`/api/companies/${props.idEntreprise}/student-search?idDept=${store.getSelectedDepartment?.departement.id}&year=${store.getCurrentYear}`)

const searchFields = (search: CompanyStudentSearch) => [search.Inscription.Etudiant.nom, search.Inscription.Etudiant.prenom, search.Inscription.Formation.nomFormation]

const columns: TableColumn<CompanyStudentSearch>[] = [
  {
    id: 'date',
    accessorFn: row => row.dateCreation,
    header: 'Date',
    cell: ({ row }) => formatDateToFRFormat(row.getValue('date'))
  },
  {
    id: 'nom',
    accessorFn: row => row.Inscription.Etudiant.nom,
    header: 'Nom'
  },
  {
    id: 'firstName',
    accessorFn: row => row.Inscription.Etudiant.prenom,
    header: 'Prénom'
  },
  {
    id: 'formation',
    accessorFn: row => row.Inscription.Formation.nomFormation,
    header: ({ column }) => getSortableSelectHeader(
      column,
      'Formation',
      companies.value ?? [],
      row => row.Inscription.Formation.nomFormation
    ),
    cell: ({ row }) => {
      const formation = row.original.Inscription.Formation.nomFormation
      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        formation.length
          ? h(
              UBadge,
              {
                color: 'neutral',
                variant: 'subtle',
                class: 'whitespace-normal'
              },
              () => formation
            )
          : 'N/A'
      )
    },
    enableSorting: false
  },
  {
    id: 'Mission',
    accessorFn: row => row.titre,
    header: 'Mission'
  },
  {
    accessorKey: 'status',
    header: ({ column }) => getSortableSelectHeader(
      column,
      'Status',
      companies.value ?? [],
      'status',
      Object.keys(DetailStatus),
      value => DetailStatus[value as keyof typeof DetailStatus]?.label
    ),
    cell: ({ row }) => h(StatusBadge, { status: row.original.status }),
    enableSorting: false
  },
  // TODO: Ajouter redirection vers la recherche de l'étudiant
  { id: 'action' }
]

function onSelected(_row: CompanyStudentSearch) {
  // TODO: Ajouter redirection vers la recherche de l'étudiant
  return
}
</script>

<template>
  <div>
    <DataTable
      :data="companies"
      :columns="columns"
      :search-fields="searchFields"
      search-placeholder="Rechercher..."
      :page-size="5"
      selectable
      sortable
      @selected="onSelected"
    >
      <template #action-cell>
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
