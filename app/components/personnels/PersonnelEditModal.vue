<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import type { Personnel } from '~~/generated/prisma/client.ts'
import type { PersonnelUpdateInput } from '~~/generated/prisma/models'
import { personnelUpdateBodySchema } from '~~/shared/schemas/personnel'

const props = defineProps<{
  editPersonnel: Personnel
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const schemaFields = personnelUpdateBodySchema
type Schema = z.output<typeof schemaFields>

const emit = defineEmits<{
  saved: [personnel: Personnel]
}>()

type StateType = Pick<Personnel, 'nom' | 'prenom'>
function createDefaultState(): StateType {
  return { nom: props.editPersonnel.nom, prenom: props.editPersonnel.prenom }
}

let state = reactive<StateType>(createDefaultState())
function resetState() {
  state = createDefaultState()
}

const validation = computed(() => schemaFields.safeParse(state))
const isSaveButtonDisabled = computed(() => !validation.value.success)

const validationMessage = computed(() => {
  if (validation.value.success) return ''
  return validation.value.error.issues[0]?.message
})

const toast = useToast()
const isLoading = ref(false)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    const response = await $fetch<Personnel>(`/api/personnels/${props.editPersonnel.numPersonnel}`, {
      method: 'PATCH',
      body: { nom: state.nom, prenom: state.prenom } satisfies Pick<PersonnelUpdateInput, 'nom' | 'prenom'>
    })

    toast.add({
      title: 'Personnel mis à jour',
      description: `Le personnel ${response.prenom} ${response.nom} a été mis à jour avec succès.`,
      color: 'success'
    })

    emit('saved', response)

    resetState()

    isOpen.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Erreur',
      description: 'Impossible de mettre à jour le personnel.',
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
    :title="`Modification du personnel ${props.editPersonnel?.nom} ${props.editPersonnel?.prenom}`"
    @update:open="(open: boolean) => { if (!open) resetState() }"
  >
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
            :minlength="2"
            :maxlength="50"
            required
          />
        </UFormField>
        <UFormField
          label="Prénom"
          name="prenom"
        >
          <UInput
            v-model="state.prenom"
            class="w-full"
            :minlength="2"
            :maxlength="50"
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
            :disabled="isSaveButtonDisabled"
            :loading="isLoading"
          >
            Modifier
          </UButton>
        </UTooltip>
      </div>
    </template>
  </UModal>
</template>
