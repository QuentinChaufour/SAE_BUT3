<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Column, type SortingState } from '@tanstack/vue-table'
import type { Entreprise, RechercheStage, DepartementTag } from '~~/generated/prisma/client'
import { Recherche_Stage_Status } from '~~/generated/prisma/enums'

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

const table = useTemplateRef('table')

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const UBadge = resolveComponent('UBadge')

const { data: rechercheStage } = await useFetch<RechercheStageWithEntreprise[]>(`/api/students/${props.etudiantId}/search`)

const search = ref('')
const filteredRechercheStage = computed(() => {
  const searchTerms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (!searchTerms.length) return rechercheStage.value

  return rechercheStage.value?.filter((stage) => {
    const searchString = [stage.titre, stage.Entreprise.nom, stage.Entreprise.ville, ...stage.DepartementTagRecherche.map(tag => tag.DepartementTag.nomTag)]
      .filter(Boolean)
      .map(value => value?.toLocaleLowerCase())
      .join(' ')

    return searchTerms.every(term => searchString.includes(term))
  })
})

const detailStatus = {
  [Recherche_Stage_Status.Accepte]: { label: 'Accepté', color: 'success' as const },
  [Recherche_Stage_Status.Abandon]: { label: 'Abandonné', color: 'error' as const },
  [Recherche_Stage_Status.AttenteEnvoi]: { label: 'En attente d\'envoi', color: 'neutral' as const },
  [Recherche_Stage_Status.Refuse]: { label: 'Refusé', color: 'warning' as const },
  [Recherche_Stage_Status.AttenteReponse]: { label: 'En attente de réponse', color: 'error' as const },
  [Recherche_Stage_Status.Entretien]: { label: 'Entretien', color: 'error' as const }
}

const columns: TableColumn<RechercheStageWithEntreprise>[] = [
  {
    accessorKey: 'dateDerniereModification',
    header: ({ column }) => getHeader(column, 'Date MàJ'),
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
    header: ({ column }) => getHeader(column, 'Entreprise')
  },
  {
    accessorKey: 'titre',
    header: ({ column }) => getHeader(column, 'Titre'),
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
    header: ({ column }) => getHeader(column, 'Ville'),
    cell: ({ row }) => row.original.Entreprise.ville ?? 'N/A'
  },
  {
    accessorKey: 'status',
    header: ({ column }) => getHeader(column, 'Status'),
    cell: ({ row }) => {
      const statusDetail = detailStatus[row.getValue('status') as Recherche_Stage_Status]
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color: statusDetail.color }, () => statusDetail.label)
    }
  },
  {
    id: 'tags',
    accessorFn: row =>
      row.DepartementTagRecherche.map(
        relation => relation.DepartementTag.nomTag
      ),
    header: ({ column }) => getHeader(column, 'Etiquettes'),
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
    header: ({ column }) => getHeader(column, 'Alternance'),
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
        onSelect: () => emit('delete', search.idRecherche)
      }
    ]
  ]
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

function getHeader(column: Column<RechercheStageWithEntreprise>, label: string) {
  const isSorted = column.getIsSorted()
  return h(
    UDropdownMenu,
    {
      'content': { align: 'start' },
      'aria-label': 'Actions',
      'items': [
        {
          label: 'Ascendant',
          type: 'checkbox',
          icon: 'i-lucide-arrow-up-narrow-wide',
          checked: isSorted === 'asc',
          onSelect: () => {
            if (isSorted === 'asc') {
              column.clearSorting()
            } else {
              column.toggleSorting(false)
            }
          }
        },
        {
          label: 'Descendant',
          icon: 'i-lucide-arrow-down-wide-narrow',
          type: 'checkbox',
          checked: isSorted === 'desc',
          onSelect: () => {
            if (isSorted === 'desc') {
              column.clearSorting()
            } else {
              column.toggleSorting(true)
            }
          }
        }
      ]
    },
    () =>
      h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        label,
        'icon': isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        'class': '-mx-2.5 data-[state=open]:bg-elevated',
        'aria-label': `Trier par ${isSorted === 'asc' ? 'décroissant' : 'croissant'}`
      })
  )
}

const sorting = ref<SortingState>([])
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <div class="flex px-0 py-3.5 border-b border-accented">
      <UInput
        v-model="search"
        class="w-full"
        placeholder="Rechercher parmi les recherches..."
      />
    </div>

    <UTable
      ref="table"
      v-model:sorting="sorting"
      v-model:pagination="pagination"
      :data="filteredRechercheStage"
      :columns="columns"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }"
      :empty="'Aucune donnée disponible.'"
      class="flex-1"
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
    </UTable>

    <div class="flex justify-end border-t border-default pt-4 px-4">
      <UPagination
        :page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
        :items-per-page="table?.tableApi?.getState().pagination.pageSize"
        :total="table?.tableApi?.getFilteredRowModel().rows.length"
        @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
      />
    </div>
  </div>
</template>
