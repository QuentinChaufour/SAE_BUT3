<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const store = useConnectedPersonnelStore()

const departmentsItems = computed<DropdownMenuItem[][]>(() => {
  const currentDepartment = store.getSelectedDepartment
  const list = store.getDepartments.map(department => ({
    label: department.departement.nom,
    checked: currentDepartment?.departement.id === department.departement.id,
    type: 'checkbox' as const,
    onSelect() {
      store.setSelectedDepartment(department)
      reloadNuxtApp()
    }
  }))

  return [
    [
      { type: 'label', label: 'Département' },
      { type: 'separator' },
      ...list
    ]
  ]
})

const yearsItems = computed<DropdownMenuItem[][]>(() => {
  const currentYear = store.getCurrentYear
  const list = store.getSelectedDepartment?.annees.map(year => ({
    label: year,
    checked: currentYear === year,
    type: 'checkbox' as const,
    onSelect() {
      store.setCurrentYear(year)
      reloadNuxtApp()
    }
  })) ?? []

  return [
    [
      { type: 'label', label: 'Année' },
      { type: 'separator' },
      ...list
    ]
  ]
})
</script>

<template>
  <div class="space-y-2">
    <UDropdownMenu
      :items="yearsItems"
      :content="{ align: 'center', collisionPadding: 12 }"
      :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <UButton
        v-bind="{
          label: collapsed ? undefined : store.getCurrentYear,
          trailingIcon: collapsed ? 'lucide:calendar' : 'mi:switch'
        }"
        color="neutral"
        variant="outline"
        block
        :square="collapsed"
        class="data-[state=open]:bg-elevated"
        :ui="{
          trailingIcon: 'text-dimmed'
        }"
      />
    </UDropdownMenu>

    <UDropdownMenu
      :items="departmentsItems"
      :content="{ align: 'center', collisionPadding: 12 }"
      :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
    >
      <UButton
        v-bind="{
          label: collapsed ? undefined : store.getSelectedDepartment?.departement.nom,
          trailingIcon: collapsed ? 'lucide:school' : 'mi:switch'
        }"
        color="neutral"
        variant="outline"
        block
        :square="collapsed"
        class="data-[state=open]:bg-elevated"
        :ui="{
          trailingIcon: 'text-dimmed'
        }"
      />
    </UDropdownMenu>
  </div>
</template>
