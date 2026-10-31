<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { Departement } from '~~/generated/prisma/client'
import ConfirmModal from '../common/ConfirmModal.vue'
import DataTable from '../common/DataTable.vue'
import DepartmentModal from './DepartmentModal.vue'

type DepartementType = Pick<Departement, 'idDepartement' | 'nom'>

const emit = defineEmits<{
  'secretariats': [departement: DepartementType]
  'edit-name': [departement: DepartementType]
}>()

const { data: departments, refresh } = useFetch<DepartementType[]>('/api/departments')

defineExpose({ refresh })

const isDeleteModalOpen = ref(false)

const departmentToDelete = ref<DepartementType | null>(null)
const departmentToEdit = ref<DepartementType | null>(null)

const toast = useToast()

const columns: TableColumn<DepartementType>[] = [
  { id: 'nom', header: 'Nom', accessorKey: 'nom' },
  { id: 'action' }
]

const searchFields = (department: DepartementType) => [department.nom]

function openDeleteModal(department: DepartementType) {
  departmentToDelete.value = department
  isDeleteModalOpen.value = true
}

function openEditModal(department: DepartementType) {
  departmentToEdit.value = department
  emit('edit-name', department)
}

async function handleConfirmDelete() {
  if (!departmentToDelete.value) return

  await $fetch(`/api/departments/${departmentToDelete.value.idDepartement}`, { method: 'DELETE' })
  await refresh()

  toast.add({
    title: 'Département supprimé',
    description: `Le département ${departmentToDelete.value.nom} a été supprimé avec succès.`,
    color: 'success'
  })

  isDeleteModalOpen.value = false
  departmentToDelete.value = null
}

function getDropdownActions(department: DepartementType): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Modifier le nom',
        icon: 'i-lucide-edit-2',
        onSelect: () => openEditModal(department)
      },
      {
        label: 'Secrétariats',
        icon: 'i-lucide-users',
        onSelect: () => emit('secretariats', department)
      },
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: () => openDeleteModal(department)
      }
    ]
  ]
}

function getDescription(): string {
  if (!departmentToDelete.value) return ''
  return [
    `Êtes-vous sûr de vouloir supprimer le département ${departmentToDelete.value?.nom} ?`,
    'Cette action est irréversible.'
  ].join('\n')
}
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <DataTable
      :data="departments"
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

    <DepartmentModal
      v-if="departmentToEdit"
      :open="true"
      :edit-department="departmentToEdit"
      @update:open="(open) => { if (!open) departmentToEdit = null }"
      @saved="() => refresh()"
    />

    <ConfirmModal
      :open="isDeleteModalOpen"
      title="Supprimer le département"
      :description="getDescription()"
      @confirm="handleConfirmDelete"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>
