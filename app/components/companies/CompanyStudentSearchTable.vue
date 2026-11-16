<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import DataTable from '~/components/common/DataTable.vue'
import type { Entreprise, Etudiant, Formation, RechercheStage } from '~~/generated/prisma/client'

const props = defineProps<{
  idEntreprise: string
}>()

const store = useConnectedPersonnelStore()

type CompanyStudentSearch = Pick<RechercheStage, 'idRecherche' | 'dateCreation' | 'titre'> & {
    Inscription: {  
        Formation: Pick<Formation, 'nomFormation'>
        Etudiant: Pick<Etudiant, 'nom' | 'prenom'>
    },
    Entreprise: Pick<Entreprise, 'nom'>
}

const { data: companies } = useFetch<CompanyStudentSearch[]>(`/api/companies/${props.idEntreprise}/student-search?idDept=${store.getSelectedDepartment?.departement.id}&year=${store.getCurrentYear}`)


const searchFields = (search: CompanyStudentSearch) => [search.Inscription.Etudiant.nom, search.Inscription.Etudiant.prenom, search.Inscription.Formation.nomFormation]

const columns: TableColumn<CompanyStudentSearch>[] = [
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
    header: 'Formation'
  },
  {
    id: 'Mission',
    accessorFn: row => row.titre,
    header: 'Mission'
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
