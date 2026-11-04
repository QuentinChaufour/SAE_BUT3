<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { Entreprise, RechercheStage, DepartementTag } from '~~/generated/prisma/client'
import DataTable from '~/components/common/DataTable.vue'

type RechercheStageWithEntreprise
  = Pick<RechercheStage, 'idRecherche' | 'titre'  | 'alternance'> & {
    Entreprise: Pick<Entreprise, 'nom' | 'ville'>
  } & { DepartementTagRecherche: { DepartementTag: Pick<DepartementTag, 'nomTag'> }[] }
 
const props = defineProps<{
  departementId: string
  readOnly?: boolean
}>()

const emit = defineEmits<{
  edit: [recherche: RechercheStageWithEntreprise]
  delete: [idRecherche: number]
}>()

const { data: rechercheStage } = await useFetch<RechercheStageWithEntreprise[]>(`/api/students/`, {query: { departementId: props.departementId }})

function flattenValue(value: unknown): string[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value.flatMap(flattenValue)
  if (typeof value === 'object') return Object.values(value).flatMap(flattenValue)
  return [String(value)]
}

function formatHeader(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, character => character.toUpperCase())
}

function formatCellValue(value: unknown, key: string): string {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'

  const values = flattenValue(value)
  const result = values.join(', ')

  if (key.toLowerCase().includes('date')) {
    const date = new Date(result)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('fr-FR')
    }
  }

  return result
}

const searchFields = (stage: RechercheStageWithEntreprise) =>
  Object.values(stage).flatMap(flattenValue)

const columns = computed<TableColumn<RechercheStageWithEntreprise>[]>(() => {
  const keys = new Set(
    (rechercheStage.value ?? []).flatMap(stage => Object.keys(stage))
  )

  const dynamicColumns: TableColumn<RechercheStageWithEntreprise>[] = Array.from(keys, key => ({
      accessorKey: key,
      header: formatHeader(key),
      cell: ({ row }) =>
        formatCellValue(row.getValue(key), key)
    }))

  return [...dynamicColumns, { id: 'action' }]
})

function getDropdownActions(search: RechercheStageWithEntreprise): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-edit',
        onSelect: () => emit('edit', search)
      },
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: () => emit('delete', search.idRecherche) // TODO: Remplacer par une modal de confirmation + suppression dans ce composant
      }
    ]
  ]
}
</script>

<template>
  <DataTable
    :data="rechercheStage"
    :columns="columns"
    :search-fields="searchFields"
    search-placeholder="Rechercher parmi les recherches..."
    :page-size="5"
    sortable
  >
    <template #action-cell="{ row }">
      <UDropdownMenu
        v-if="!props.readOnly"
        :items="getDropdownActions(row.original)"
      >
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          aria-label="Actions"
        />
      </UDropdownMenu>
      <UButton
        v-else
        icon="i-heroicons-chevron-right"
        color="neutral"
        variant="ghost"
        aria-label="Voir"
        @click="emit('edit', row.original)"
      />
    </template>
  </DataTable>
</template>