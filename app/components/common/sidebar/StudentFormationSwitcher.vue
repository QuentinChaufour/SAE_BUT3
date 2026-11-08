<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const store = useConnectedStudentStore()

const items = computed<DropdownMenuItem[][]>(() => {
  const currentPromotion = store.getSelectedPromotion
  const list = store.getPromotions.map(promotion => ({
    label: promotion.formation.nom,
    description: promotion.annee,
    checked: currentPromotion?.idInscription === promotion.idInscription,
    type: 'checkbox' as const,
    onSelect() {
      store.setSelectedPromotion(promotion)
      reloadNuxtApp()
    }
  }))

  return [
    [
      { type: 'label', label: 'Promotion' },
      { type: 'separator' },
      ...list
    ]
  ]
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        label: collapsed ? undefined : store.getSelectedPromotion?.formation.nom,
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
</template>
