<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { Entreprise, RechercheStage, DepartementTag } from '~~/generated/prisma/client'
import SearchStatusBadge from './SearchStatusBadge.vue'
import DataTable from '~/components/common/DataTable.vue'

type RechercheStageWithEntreprise
  = Pick<RechercheStage, 'idRecherche' | 'titre' | 'dateDerniereModification' | 'alternance' | 'status'> & {
    Entreprise: Pick<Entreprise, 'nom' | 'ville'>
  } & { DepartementTagRecherche: { DepartementTag: Pick<DepartementTag, 'nomTag'> }[] }

const props = defineProps<{
  etudiantId: string
  readOnly?: boolean
}>()

const emit = defineEmits<{
  edit: [recherche: RechercheStageWithEntreprise]
  delete: [idRecherche: number]
}>()

const UBadge = resolveComponent('UBadge')

const { data: rechercheStage } = await useFetch<RechercheStageWithEntreprise[]>(`/api/students/${props.etudiantId}/search`)

const searchFields = (stage: RechercheStageWithEntreprise) => [
  stage.titre,
  stage.Entreprise.nom,
  stage.Entreprise.ville,
  ...stage.DepartementTagRecherche.map(tag => tag.DepartementTag.nomTag)
]

const columns: TableColumn<RechercheStageWithEntreprise>[] = [
  {
    accessorKey: 'dateDerniereModification',
    header: 'Date MàJ',
    cell: ({ row }) => {
      return new Date(row.getValue('dateDerniereModification')).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  },
  {
    id: 'entreprise',
    accessorFn: row => row.Entreprise.nom,
    header: 'Entreprise'
  },
  {
    accessorKey: 'titre',
    header: 'Titre',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'whitespace-normal break-words max-w-xs' },
        row.getValue('titre')
      )
  },
  {
    id: 'ville',
    accessorFn: row => row.Entreprise.ville,
    header: 'Ville',
    cell: ({ row }) => row.original.Entreprise.ville ?? 'N/A'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => h(SearchStatusBadge, { status: row.original.status })
  },
  {
    id: 'tags',
    accessorFn: row =>
      row.DepartementTagRecherche.map(
        relation => relation.DepartementTag.nomTag
      ),
    header: 'Etiquettes',
    cell: ({ row }) => {
      const tags = row.original.DepartementTagRecherche
      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        tags.length
          ? tags.map(tag =>
              h(
                UBadge,
                {
                  color: 'neutral',
                  variant: 'subtle',
                  class: 'whitespace-normal'
                },
                () => tag.DepartementTag.nomTag
              )
            )
          : 'N/A'
      )
    }
  },
  {
    accessorKey: 'alternance',
    header: 'Alternance',
    cell: ({ row }) => (row.getValue('alternance') ? 'Oui' : 'Non')
  },
  { id: 'action' }
]

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
