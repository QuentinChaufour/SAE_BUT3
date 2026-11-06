<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import SelectCompanyInput from '~/components/companies/SelectCompanyInput.vue'
import type { RechercheStage } from '~~/generated/prisma/client.ts'
import type { RechercheStageUncheckedCreateInput } from '~~/generated/prisma/models'

import { studentSearchFields } from '~~/shared/schemas/student-search'

type Schema = z.output<typeof studentSearchFields>

const emit = defineEmits<{
  created: [search: RechercheStage]
}>()

const isOpen = ref(false)
interface StateType {
  titre: string
  description: string
  alternance: boolean
  idEntreprise: number | undefined
}

function createDefaultState(): StateType {
  return {
    titre: '',
    description: '',
    alternance: false,
    idEntreprise: undefined
  }
}

const state = reactive<StateType>(createDefaultState())

const validation = computed(() => studentSearchFields.safeParse(state))

const isCreateButtonDisabled = computed(() => !validation.value.success)

const validationMessage = computed(() => {
  if (validation.value.success) return ''
  return validation.value.error.issues[0]?.message
})

const toast = useToast()

const isLoading = ref(false)
async function onSubmit(_event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  const session = useUserSession()
  const numEtu = session.user.value!.numId

  try {
    const response = await $fetch<RechercheStage>(`/api/students/${numEtu}/search`, {
      method: 'POST',
      body: {
        titre: state.titre,
        description: state.description,
        alternance: state.alternance,
        idEntreprise: state.idEntreprise as number,
        annee: '2026-2027' // TODO: récupérer l'année actuelle (via pinia?)
      } satisfies Omit<RechercheStageUncheckedCreateInput, 'numEtu'>
    })

    toast.add({
      title: 'Recherche créée',
      description: 'Votre recherche a été créée avec succès.',
      color: 'success'
    })

    emit('created', response)

    Object.assign(state, createDefaultState())

    isOpen.value = false
  } catch (error) {
    console.error(error)

    toast.add({
      title: 'Erreur',
      description: 'Impossible de créer votre recherche.',
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
    title="Ajout d'une recherche de stage"
  >
    <UButton icon="i-lucide-plus">
      Ajouter
    </UButton>

    <template #body>
      <UForm
        id="create-search-form"
        class="flex flex-col gap-3"
        :schema="studentSearchFields"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField
          label="Entreprise"
          name="entreprise"
        >
          <SelectCompanyInput
            v-model:id-entreprise="state.idEntreprise"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Titre"
          name="titre"
        >
          <UInput
            v-model="state.titre"
            class="w-full"
            :minlength="5"
            :maxlength="100"
            required
          />
        </UFormField>
        <UFormField
          label="Description"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            :rows="6"
            class="w-full"
            :ui="{ base: 'resize-none' }"
            :maxlength="2000"
          />
        </UFormField>
        <!-- TODO: Add tags -->
        <UFormField
          label="Alternance"
          name="alternance"
        >
          <UCheckbox
            v-model="state.alternance"
            label="La recherche concerne t-elle une alternance ?"
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
