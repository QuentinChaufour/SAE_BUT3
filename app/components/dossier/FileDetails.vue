<script setup lang="ts">

const model = defineModel<EventFile[]>({ required: false, default: () => [] })

const props = withDefaults(defineProps<{
  files: EventFile[],
  readOnly?: boolean
}>(), {
  readOnly: false
})

const emits = defineEmits<{
  download: [EventFile]
}>()

function formatFileSize(size: number | undefined): string {
  if (!size) {
    return "Unknown"
  }

  if(size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} Mo`
  }

  return `${(size / 1024).toFixed(2)} Ko`
}

function deleteFile(file: EventFile) {

  if (!model.value.includes(file)) {
    model.value.push(file)
  }
  else {
    model.value = model.value.filter(f => f !== file)
  }
}

</script>

<template>
  <div
    v-for="file in props.files"
  >
    <div :class="'flex items-center justify-between gap-2 ' + (model.some(f => f.id === file.id) ? 'bg-red-100' : '')">
      <UIcon name="file" class="w-5 h-5 text-gray-500" />
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">{{ file.name }}</span>
        <span class="text-xs text-gray-400">({{ formatFileSize(file.size) }})</span>
      </div>

      <UButton
        @click="emits('download', file)"
      >
        Télécharger
      </UButton>

      <UButton
        v-if="!props.readOnly"
        @click.prevent="deleteFile(file)"
        class="text-red-500 hover:text-red-700 text-sm"
      >
        {{ model.some(f => f.id === file.id) ? 'Annuler' : 'Supprimer' }}
      </UButton>
    </div>
  </div>

</template>