<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod/v4'

const props = withDefaults(defineProps<{
  event?: {}
  creation?: boolean
}>(), {
  creation: false
})

const schema = z.object({
  titre: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string()
})

type EventSchema = z.output<typeof schema>

const state = reactive({
  titre: props.event?.titre || '',
  description: props.event?.description || ''
})

const emits = defineEmits<{
  (e: 'submit', event: FormSubmitEvent<EventSchema>): void
}>()
</script>

<template>
  <div class="min-w-0 flex-2 mr-10 ml-10 space-y-5">
    <div class="flex flex-wrap justify-between gap-4">
      <UFormField
        label="Titre"
        name="titre"
      >
        <UInput
          disabled
          class="w-full sm:w-auto"
          :model-value="state.titre"
        />
      </UFormField>
      <UFormField
        label="Description"
        name="description"
      >
        <UInput
          disabled
          class="w-full sm:w-auto"
          :model-value="state.description"
        />
      </UFormField>
    </div>
    <!-- Form to update the 'dossier' description -->
    <UForm
      :schema="schema"
      :state="state"
      class=" mt-6 mb-5 min-w-0 space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Description"
        name="description"
      >
        <UTextarea
          v-model="state.description"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        :disabled="!hasDescriptionChanged"
      >
        Modifier
      </UButton>
    </UForm>

    <UAccordion :items="contacts">
      <template #content="{ item, index }">
        <ContactForm v-bind="item" />
      </template>
    </UAccordion>
    <div>
      <!-- TODO replace with separator component -->
      <h2>Documents</h2>
      <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Pièces jointes
      </p>
    </div>
    <UFileUpload
      :model-value="files"
      :ui="{ base: 'hidden' }"
      layout="list"
      multiple
      class="w-fit"
    >
      <template #file-trailing="{ index }">
        <!-- TODO add download functionality -->
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="link"
          size="xs"
          aria-label="Delete file"
          @click.stop="deleteFile(index)"
        />
      </template>
    </UFileUpload>
  </div>
</template>
