<script setup lang="ts">
import { UBadge } from '#components'
import type { TableColumn } from '@nuxt/ui'
import DataTable from '~/components/common/DataTable.vue'
import type { Entreprise, Etudiant, Formation, RechercheStage } from '~~/generated/prisma/client'

const props = defineProps<{
  idEntreprise: string
}>()

const emit = defineEmits<{
  'company-name': [name: string | undefined]
}>()

const store = useConnectedPersonnelStore()

type CompanyStudentSearch = Pick<RechercheStage, 'idRecherche' | 'dateCreation' | 'titre'> & {
  Inscription: {
    Formation: Pick<Formation, 'nomFormation'>
    Etudiant: Pick<Etudiant, 'nom' | 'prenom'>
  }
  Entreprise: Pick<Entreprise, 'nom'>
}

const { data: companies } = useFetch<CompanyStudentSearch[]>(`/api/companies/${props.idEntreprise}/student-search?idDept=${store.getSelectedDepartment?.departement.id}&year=${store.getCurrentYear}`)

watch(
  companies,
  searches => emit('company-name', searches?.[0]?.Entreprise.nom),
  { immediate: true }
)

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
  // TODO: Ajouter redirection vers la recherche de l'étudiant
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
