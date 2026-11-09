<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import DataTable from '~/components/common/DataTable.vue'
import ConfirmModal from '~/components/common/ConfirmModal.vue'
import type { Entreprise } from '~~/generated/prisma/client'

const props = defineProps<{
  readOnly?: boolean
}>()

const emit = defineEmits<{
  edit: [company: Entreprise]
  delete: [idCompany: number]
}>()

const isDeleteModalOpen = ref(false)
const companyToDelete = ref<Entreprise | null>(null)

const { data: companies, refresh } = useFetch<Entreprise[]>(`/api/companies`)

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

const toast = useToast()

function openDeleteModal(company: Entreprise) {
  companyToDelete.value = company
  isDeleteModalOpen.value = true
}

async function handleConfirmDelete() {
  if (!companyToDelete.value) return

  try {
    await $fetch(`/api/companies/${companyToDelete.value.idEntreprise}`, { method: 'DELETE' })
    await refresh()

    toast.add({
      title: 'Entreprise supprimée',
      description: `L'entreprise ${companyToDelete.value.nom} a été supprimée avec succès.`,
      color: 'success'
    })

    isDeleteModalOpen.value = false
    companyToDelete.value = null
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Erreur',
      description: `Une erreur est survenue lors de la suppression de l'entreprise ${companyToDelete.value!.nom}.`,
      color: 'error'
    })
  }
}

function getDropdownActions(company: Entreprise): DropdownMenuItem[][] {
  const viewDemarcheAction: DropdownMenuItem = {
    label: 'Recherches étudiantes',
    icon: 'i-lucide-text-search',
    onSelect: () => emit('edit', company)
  }

  return [
    props.readOnly
      ? [
          {
            label: 'Voir les infos',
            icon: 'i-lucide-eye',
            onSelect: () => emit('edit', company)
          },
          viewDemarcheAction
        ]
      : [
          viewDemarcheAction,
          {
            label: 'Modifier',
            icon: 'i-lucide-edit',
            onSelect: () => emit('edit', company)
          },
          {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect: () => openDeleteModal(company)
          }
        ]
  ]
}

defineExpose({ refresh })
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
        <UDropdownMenu :items="getDropdownActions(row.original)">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            aria-label="Actions"
          />
        </UDropdownMenu>
      </template>
    </DataTable>

    <ConfirmModal
      :open="isDeleteModalOpen"
      title="Supprimer l'entreprise"
      :description="`Êtes-vous sûr de vouloir supprimer l'entreprise ${companyToDelete?.nom} ? L'ensemble des recherches liées seront supprimées, et peut impacté les autres départements. Cette action est irréversible.`"
      @cancel="isDeleteModalOpen = false"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
