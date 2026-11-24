<script setup lang="ts">
import type { DemarcheContact } from '~~/generated/prisma/client'

defineProps<{
  contact: DemarcheContact
}>()
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <div
      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-sm text-primary-700 dark:bg-primary-900 dark:text-primary-200"
    >
      {{ contact.prenom?.charAt(0) }}{{ contact.nom.charAt(0) }}
    </div>
    <div class="min-w-0">
      <p class="truncate font-medium text-gray-900 dark:text-white">
        {{ contact.prenom || 'Mr./Mme.' }} {{ contact.nom }}
      </p>
      <p class="truncate text-sm text-gray-500 dark:text-gray-400">
        {{ contact.fonction || '' }}
      </p>
    </div>
  </div>
</template>
