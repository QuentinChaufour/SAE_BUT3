<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { Departement, Personnel } from '~~/generated/prisma/client'
import { Personnel_Role } from '~~/generated/prisma/client'
import ConfirmModal from '../common/ConfirmModal.vue'
import DataTable from '../common/DataTable.vue'

type PropsType
  = { type: typeof Personnel_Role.admin } | {
    type: typeof Personnel_Role.secretariat
    department: Departement
  }
const props = defineProps<PropsType>()

const emit = defineEmits<{
  'edit-personnel': [person: Personnel]
}>()

let route = `/api/personnels?role=${props.type}`
if (props.type === Personnel_Role.secretariat) {
  route += `&department_id=${props.department.idDepartement}`
}

const { data: personnels, refresh } = useFetch<Personnel[]>(route)

defineExpose({ refresh })

const isDeleteModalOpen = ref(false)

const personnelToEdit = ref<Personnel | null>(null)
const personnelToDelete = ref<Personnel | null>(null)

const toast = useToast()

const columns: TableColumn<Personnel>[] = [
  { id: 'nom', header: 'Nom', accessorKey: 'nom' },
  { id: 'prenom', header: 'Prénom', accessorKey: 'prenom' },
  { id: 'numPersonnel', header: 'Numéro de personnel', accessorKey: 'numPersonnel' },
  { id: 'action' }
]

const searchFields = (personnel: Personnel) => [personnel.nom, personnel.prenom, personnel.numPersonnel]

function openDeleteModal(personnel: Personnel) {
  personnelToDelete.value = personnel
  isDeleteModalOpen.value = true
}

function openEditModal(personnel: Personnel) {
  personnelToEdit.value = personnel
  emit('edit-personnel', personnel)
}

async function handleConfirmDelete() {
  if (!personnelToDelete.value) return

  let deleteUrl = `/api/personnels/${personnelToDelete.value.numPersonnel}`
  if (props.type === Personnel_Role.secretariat) {
    deleteUrl += `/departements/${props.department.idDepartement}`
  }

  await $fetch(deleteUrl, { method: 'DELETE' })
  await refresh()

  toast.add({
    title: 'Personnel supprimée',
    description: `Le personnel ${personnelToDelete.value.nom} a été supprimé avec succès.`,
    color: 'success'
  })

  isDeleteModalOpen.value = false
  personnelToDelete.value = null
}

function getDropdownActions(personnel: Personnel): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-edit-2',
        onSelect: () => openEditModal(personnel)
      },
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: () => openDeleteModal(personnel)
      }
    ]
  ]
}

function getDescription(): string {
  if (!personnelToDelete.value) return ''
  return [
    `Êtes-vous sûr de vouloir supprimer la personne ${personnelToDelete.value?.nom} ?`,
    props.type === Personnel_Role.secretariat && 'Si cette personne est présente dans un autre département, son compte ne sera pas supprimé.',
    'Cette action est irréversible.'
  ].filter(Boolean).join('\n')
}
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <DataTable
      :data="personnels"
      :columns="columns"
      :search-fields="searchFields"
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
      title="Supprimer le personnel"
      :description="getDescription()"
      @confirm="handleConfirmDelete"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>
