<script setup lang="ts">
import { z } from 'zod'
import SearchCompanySiretForm from './forms/SearchCompanySiretForm.vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Entreprise } from '~~/generated/prisma/client.ts'

const schema = z.object({
  nom: z.string().trim().min(2, 'Le nom de l\'entreprise doit faire au moins 2 caractères.').max(100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères.'),
  nomEtab: z.string().trim().max(100, 'Le nom de l\'établissement ne peut pas dépasser 100 caractères.').optional(),
  siret: z.string().trim().length(14, 'Le SIRET doit contenir exactement 14 chiffres.').optional(),
  pays: z.string().trim().max(100, 'Le nom du pays ne peut pas dépasser 100 caractères.').optional(),
  adresse: z.string().trim().max(200, 'L\'adresse ne peut pas dépasser 200 caractères.').optional(),
  ville: z.string().trim().max(100, 'La ville ne peut pas dépasser 100 caractères.').optional(),
  codePostal: z.string().trim().max(10, 'Le code postal ne peut pas dépasser 10 caractères.').optional()
})

type Schema = z.output<typeof schema>

export interface EntrepriseStateType {
  nom: string
  nomEtab?: string
  adresse: string
  ville: string
  codePostal: string
  pays: string
  siret: string
}

const isOpen = defineModel<boolean>('open', { default: false })
const toast = useToast()

const props = defineProps<{
  initialNomEntreprise?: string
}>()

const emit = defineEmits<{
  created: [entreprise: Entreprise]
}>()

const state = reactive<EntrepriseStateType & { etranger: boolean }>({
  nom: props.initialNomEntreprise ?? '',
  nomEtab: '',
  adresse: '',
  ville: '',
  codePostal: '',
  siret: '',
  pays: 'France',
  etranger: false
})

function isCreateButtonDisabled() {
  const elements = [state.nom, state.adresse, state.ville]
  elements.push(state.etranger ? state.pays : state.codePostal)

  return elements.some(element => !element || element.trim() === '')
}

function entrepriseSiretFound(entreprise: EntrepriseStateType) {
  toast.add({
    title: 'Succès',
    description: `Les données de l'entreprise ${entreprise.nom} ont été récupérées avec succès.\nVérifiez les informations récuperées.`,
    color: 'success'
  })

  state.siret = entreprise.siret
  state.nom = entreprise.nom
  state.nomEtab = entreprise.nomEtab
  state.adresse = entreprise.adresse
  state.ville = entreprise.ville
  state.codePostal = entreprise.codePostal

  state.pays = entreprise.pays
  state.etranger = entreprise.pays !== 'France'
}

const isLoading = ref(false)
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    const response = await $fetch<Entreprise>('/api/companies', {
      method: 'POST',
      body: {
        nom: event.data.nom,
        nomEtab: event.data.nomEtab || null,
        adresse: event.data.adresse,
        ville: event.data.ville,
        codePostal: event.data.codePostal || null,
        siret: event.data.siret || null,
        pays: event.data.pays
      }
    })

    toast.add({
      title: 'Entreprise créée',
      description: 'L\'entreprise a été créée avec succès.',
      color: 'success'
    })

    emit('created', response)

    isOpen.value = false
  } catch (error) {
    console.error(error)

    toast.add({
      title: 'Erreur',
      description: 'Impossible de créer l\'entreprise.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

function switchEtranger(status: boolean) {
  state.pays = status ? '' : 'France'
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Création d'une entreprise"
  >
    <template #body>
      <SearchCompanySiretForm @found="entrepriseSiretFound" />
      <USeparator
        class="my-3"
        label="ou"
      />
      <UForm
        id="create-company-form"
        class="flex flex-col gap-3"
        :schema="schema"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField label="Nom de l'entreprise">
          <UInput
            v-model="state.nom"
            placeholder="Nom"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Nom de l'établissement (optionnel)">
          <UInput
            v-model="state.nomEtab"
            placeholder="Nom"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Adresse">
          <UInput
            v-model="state.adresse"
            placeholder="Adresse"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Code postal">
          <UInput
            v-model="state.codePostal"
            placeholder="Code postal"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Ville">
          <UInput
            v-model="state.ville"
            placeholder="Ville"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Entreprise étrangère"
          class="mt-2"
        >
          <USwitch
            v-model="state.etranger"
            label="L'entreprise est-elle à l'étranger ?"
            @update:model-value="switchEtranger"
          />
        </UFormField>
        <UFormField
          v-if="state.etranger"
          label="Pays"
        >
          <UInput
            v-model="state.pays"
            placeholder="Pays"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          color="primary"
          type="submit"
          form="create-company-form"
          :disabled="isCreateButtonDisabled()"
          :loading="isLoading"
        >
          Créer
        </UButton>
      </div>
    </template>
  </UModal>
</template>
