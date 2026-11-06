<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import SoutenanceDataTable from '~/components/soutenance/SoutenanceDataTable.vue'

type QuotaRow = Record<string, string>

const props = defineProps<{
  departementId: string
  readOnly?: boolean
}>()

const { data: quotas } = await useFetch<QuotaRow[]>('/api/teachers/list-quotas', {
  query: { idDepartement: props.departementId }
})

const ratioPattern = /^[0-9]+\/[0-9]+$/

function setDataColor(value: unknown): string {
  const defaultColor = 'text-neutral-600 dark:text-neutral-400'

  if (typeof value !== 'string') {
    return defaultColor
  }

  const match = value.match(ratioPattern)
  if (!match) {
    return defaultColor
  }

  const [numeratorValue, denominatorValue] = match[0].split('/')
  const numerator = Number(numeratorValue)
  const denominator = Number(denominatorValue)

  if (numerator / denominator < 1) {
    return 'text-red-500'
  }

  if (numerator / denominator > 1) {
    return 'text-yellow-500'
  }

  return defaultColor
}

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

function sumColumnRatios(rows: QuotaRow[], key: string): string | undefined {
  const totals = rows.reduce(
    (sum, row) => {
      const [numeratorValue, denominatorValue] = String(row[key] ?? '').split('/')
      const numerator = Number(numeratorValue)
      const denominator = Number(denominatorValue)

      if (Number.isFinite(numerator) && Number.isFinite(denominator)) {
        sum.numerator += numerator
        sum.denominator += denominator
      }

      return sum
    },
    { numerator: 0, denominator: 0 }
  )

  return totals.numerator || totals.denominator
    ? `${totals.numerator}/${totals.denominator}`
    : undefined
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

const searchFields = (row: QuotaRow) => Object.values(row)

const columns = computed<TableColumn<QuotaRow>[]>(() => {
  const keys = new Set(
    (quotas.value ?? []).flatMap(row => Object.keys(row))
  )

  const dynamicColumns: TableColumn<QuotaRow>[] = Array.from(keys, key => ({
    accessorKey: key,
    header: formatHeader(key),
    meta: {
      headerTotal: sumColumnRatios(quotas.value ?? [], key)
    },
    cell: ({ row }) => {
      const value = row.getValue(key)

      return h(
        'span',
        { class: setDataColor(value) },
        formatCellValue(value, key)
      )
    }
  }) as TableColumn<QuotaRow>)

  return dynamicColumns
})
</script>

<template>
  <SoutenanceDataTable
    :data="quotas"
    :columns="columns"
    :search-fields="searchFields"
    search-placeholder="Rechercher un enseignant"
    :page-size="5"
    sortable
  />
</template>
