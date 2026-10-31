<script setup lang="ts">
const emit = defineEmits(['confirm', 'cancel'])

defineProps<{
  title: string
  description: string
  open: boolean
}>()
</script>

<template>
  <UModal
    :title="title"
    :open="open"
  >
    <template #body>
      <p>{{ description }}</p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          @click="emit('cancel')"
        >
          Annuler
        </UButton>
        <UButton
          form="create-search-form"
          color="primary"
          @click="emit('confirm')"
        >
          Confirmer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
