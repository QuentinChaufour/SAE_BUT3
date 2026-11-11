import type { Column } from '@tanstack/vue-table'
import { h } from 'vue'
import { UButton, UDropdownMenu } from '#components'

/**
 * Obtenir un en-tête de colonne triable avec des options de tri ascendant et descendant.
 *
 * @template T Le type de données de la ligne du tableau.
 * @param column La colonne pour laquelle générer l'en-tête triable.
 * @param label Le texte à afficher dans l'en-tête de la colonne.
 * @returns L'élément représentant l'en-tête de colonne triable.
 */
export function getSortableAscDescHeader<T extends Record<string, unknown>>(column: Column<T>, label: string) {
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
        label,
        'color': 'neutral',
        'variant': 'ghost',
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

/**
 * Créer un menu déroulant de filtrage pour une colonne donnée.
 *
 * @template T Le type de données de la ligne du tableau.
 * @template U Le type des valeurs uniques à filtrer.
 *
 * @param column La colonne pour laquelle générer le menu déroulant de filtrage.
 * @param label Le texte à afficher dans le bouton du menu déroulant.
 * @param uniqueValues Les valeurs uniques à afficher dans le menu déroulant.
 * @param displayFn La fonction pour afficher les valeurs dans le menu déroulant.
 * @returns Le composant représentant le menu déroulant de filtrage.
 */
function createFilterDropdown<T extends Record<string, unknown>, U = unknown>(
  column: Column<T>,
  label: string,
  uniqueValues: U[],
  displayFn?: (value: U) => string
) {
  const filterValue = column.getFilterValue() as U
  const hasFilter = filterValue !== undefined && filterValue !== null && filterValue !== ''

  return h(
    UDropdownMenu,
    {
      'content': { align: 'start' },
      'aria-label': `Filtrer par ${label}`,
      'items': [
        [
          {
            label: 'Tous',
            type: 'checkbox',
            checked: !hasFilter,
            onSelect: () => column.setFilterValue(undefined)
          },
          ...uniqueValues.map(val => ({
            label: displayFn ? displayFn(val) : String(val),
            type: 'checkbox' as const,
            checked: filterValue === val,
            onSelect: () => {
              if (filterValue === val) {
                column.setFilterValue(undefined)
              } else {
                column.setFilterValue(val)
              }
            }
          }))
        ]
      ]
    },
    () =>
      h(UButton, {
        label,
        'color': 'neutral',
        'variant': 'ghost',
        'icon': hasFilter ? 'i-lucide-filter-x' : 'i-lucide-filter',
        'class': '-mx-2.5 data-[state=open]:bg-elevated',
        'aria-label': `Filtrer par ${label}`
      })
  )
}

/**
 * Obtenir un en-tête de colonne triable avec des options de filtrage par sélection.
 *
 * @template T Le type de données de la ligne du tableau.
 * @template U Le type des valeurs uniques à filtrer.
 *
 * @param column La colonne pour laquelle générer l'en-tête triable.
 * @param label Le texte à afficher dans l'en-tête de la colonne.
 * @param data Les données complètes du tableau pour extraire les valeurs uniques.
 * @param accessorKey Le clé d'accès pour extraire les valeurs uniques de la colonne.
 * @param displayFn Fonction pour afficher les valeurs dans le menu déroulant.
 * @returns L'élément représentant l'en-tête de colonne triable.
 */
export function getSortableSelectHeader<T extends Record<string, unknown>, U = unknown>(
  column: Column<T>,
  label: string,
  data: T[],
  accessorKey: keyof T,
  uniqueValues?: U[],
  displayFn?: (value: U) => string
) {
  uniqueValues ??= Array.from(new Set(data.map(row => row[accessorKey]).filter(Boolean))) as U[]
  return createFilterDropdown(column, label, uniqueValues, displayFn)
}

/**
 * Obtenir un en-tête de colonne triable avec des options de filtrage par sélection multiple.
 *
 * @template T Le type de données de la ligne du tableau.
 * @template U Le type des valeurs uniques à filtrer.
 *
 * @param column La colonne pour laquelle générer l'en-tête triable.
 * @param label Le texte à afficher dans l'en-tête de la colonne.
 * @param data Les données complètes du tableau pour extraire les valeurs uniques.
 * @param getValuesFn La fonction pour extraire les valeurs uniques de la colonne à partir de chaque ligne.
 * @param displayFn La fonction pour afficher les valeurs dans le menu déroulant.
 * @returns L'élément représentant l'en-tête de colonne triable avec filtrage par sélection multiple.
 */
export function getSortableMultiSelectHeader<T extends Record<string, unknown>, U = unknown>(
  column: Column<T>,
  label: string,
  data: T[],
  getValuesFn: (row: T) => U[],
  displayFn?: (value: U) => string
) {
  const values = Array.from(new Set(data.flatMap(row => getValuesFn(row)).filter(Boolean))) as U[]
  return createFilterDropdown(column, label, values, displayFn)
}
