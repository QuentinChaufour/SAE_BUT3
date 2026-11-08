<script setup lang="ts">
const tags = defineModel<string[]>('tags', { required: true })
const props = withDefaults(defineProps<{
  optionTags?: string[]
  disabled?: boolean
}>(), {
  optionTags: () => [],
  disabled: false
})

const loading = computed(() => !(props.optionTags.length > 0))

const emits = defineEmits<{
  updatedTags: [tags: string[]]
}>()

const dossierTags = ref<string[]>(tags.value)
</script>

<template>
  <UInputMenu
    v-model="dossierTags"
    :autocomplete="'on'"
    multiple
    :loading="loading"
    :disabled="props.disabled || loading"
    :items="props.optionTags"
    @update:model-value="emits('updatedTags', $event)"
  />
</template>
