<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { Departement } from '~~/generated/prisma/client.ts'
import type { DepartementUncheckedCreateInput } from '~~/generated/prisma/models'
import { nomDepartementSchema } from '~~/shared/schemas/department'

const schemaFields = z.object({
  nom: nomDepartementSchema
})

type Schema = z.output<typeof schemaFields>

const emit = defineEmits<{
  created: [search: Departement]
}>()

const isOpen = ref(false)
interface StateType {
  nom: string
}

function createDefaultState(): StateType {
  return { nom: '' }
}

const state = reactive<StateType>(createDefaultState())

const validation = computed(() => schemaFields.safeParse(state))

const isCreateButtonDisabled = computed(() => !validation.value.success)

const validationMessage = computed(() => {
  if (validation.value.success) return ''
  return validation.value.error.issues[0]?.message
})

const toast = useToast()

const isLoading = ref(false)
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    const response = await $fetch<Departement>('/api/departments', {
      method: 'POST',
      body: { nom: state.nom } satisfies Pick<DepartementUncheckedCreateInput, 'nom'>
    })

    toast.add({
      title: 'Département créé',
      description: `Le département ${response.nom} a été créé avec succès.`,
      color: 'success'
    })

    emit('created', response)

    Object.assign(state, createDefaultState())

    isOpen.value = false
  } catch (error) {
    console.error(error)

    toast.add({
      title: 'Erreur',
      description: 'Impossible de créer le département.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Création d'un département"
  >
    <UButton icon="i-lucide-plus">
      Ajouter
    </UButton>

    <template #body>
      <UForm
        id="create-search-form"
        class="flex flex-col gap-3"
        :schema="schemaFields"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField
          label="Nom"
          name="nom"
        >
          <UInput
            v-model="state.nom"
            class="w-full"
            :minlength="3"
            :maxlength="100"
            required
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UTooltip
          :text="validationMessage"
          :disabled="!validationMessage"
        >
          <UButton
            form="create-search-form"
            type="submit"
            color="primary"
            :disabled="isCreateButtonDisabled"
            :loading="isLoading"
          >
            Créer
          </UButton>
        </UTooltip>
      </div>
    </template>
  </UModal>
</template>
