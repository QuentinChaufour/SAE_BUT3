<script setup lang="ts" generic="T extends Record<string, any>">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Column, type SortingState } from '@tanstack/vue-table'

const props = withDefaults(defineProps<{
  data?: T[] | null
  columns: TableColumn<T>[]
  sortable?: boolean
  searchFields?: (row: T) => (string | null | undefined)[]
  searchPlaceholder?: string
  pageSize?: number
  emptyText?: string
}>(), {
  data: undefined,
  sortable: false,
  searchFields: undefined,
  searchPlaceholder: 'Rechercher...',
  pageSize: 10,
  emptyText: 'Aucune donnée disponible.'
})

const table = useTemplateRef('table')
const pagination = ref({ pageIndex: 0, pageSize: props.pageSize })
const sorting = ref<SortingState>([])

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const search = ref('')
const filteredData = computed(() => {
  const rows = props.data ?? []
  const getFields = props.searchFields
  const searchTerms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  if (!getFields || !searchTerms.length) return rows

  return rows.filter((row) => {
    const searchString = getFields(row)
      .filter(Boolean)
      .map(value => value!.toLocaleLowerCase())
      .join(' ')

    return searchTerms.every(term => searchString.includes(term))
  })
})

const tableColumns = computed<TableColumn<T>[]>(() => {
  if (!props.sortable) return props.columns

  return props.columns.map((col) => {
    if (typeof col.header !== 'string' || col.enableSorting === false) return col

    const label = col.header
    return { ...col, header: ({ column }: { column: Column<T> }) => getSortableHeader(column, label) } as TableColumn<T>
  })
})

function getSortableHeader(column: Column<T>, label: string) {
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
</script>

<template>
  <div class="flex flex-col flex-1 w-full">
    <div
      v-if="searchFields"
      class="flex px-0 py-3.5 border-b border-accented"
    >
      <UInput
        v-model="search"
        class="w-full"
        :placeholder="searchPlaceholder"
      />
    </div>

    <UTable
      ref="table"
      v-model:sorting="sorting"
      v-model:pagination="pagination"
      :data="filteredData"
      :columns="tableColumns"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel()
      }"
      :empty="emptyText"
      class="flex-1"
    >
      <template
        v-for="(_, name) in $slots"
        #[name]="slotProps"
      >
        <slot
          :name="name"
          v-bind="slotProps"
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
