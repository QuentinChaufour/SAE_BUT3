<script setup lang="ts">
import { z } from 'zod'
import SelectCompanyInput from '~/components/companies/SelectCompanyInput.vue'

const schema = z.object({
  titre: z.string().trim().min(5, 'Le titre doit faire au moins 5 caractères.').max(100, 'Le titre ne peut pas dépasser 100 caractères.'),
  description: z.string().trim().max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  alternance: z.boolean().nonoptional(),
  idEntreprise: z.number().nonoptional()
})

type Schema = z.output<typeof schema>

const isOpen = ref(false)
interface StateType {
  titre: string
  description: string
  alternance: boolean
  idEntreprise: number | undefined
}

const state = reactive<StateType>({
  titre: '',
  description: '',
  alternance: false,
  idEntreprise: undefined
})
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
      <UForm class="flex flex-col gap-3">
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
            required
          />
        </UFormField>
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
        <UButton
          color="primary"
        >
          Créer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
