<script setup lang="ts">
import type { z } from 'zod'
import SearchCompanySiretForm from './forms/SearchCompanySiretForm.vue'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Entreprise } from '~~/generated/prisma/client.ts'
import { companyFields } from '~~/shared/schemas/company.ts'

type Schema = z.output<typeof companyFields>

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

export type EntrepriseStateReactive = EntrepriseStateType & { etranger: boolean }

function createDefaultState(): EntrepriseStateReactive {
  return {
    nom: props.initialNomEntreprise ?? '',
    nomEtab: '',
    adresse: '',
    ville: '',
    codePostal: '',
    siret: '',
    pays: 'France',
    etranger: false
  }
}

const state = reactive<EntrepriseStateReactive>(createDefaultState())

watch(() => isOpen.value, (open) => {
  if (open) Object.assign(state, createDefaultState())
})

const validation = computed(() => companyFields.safeParse(state))

const isCreateButtonDisabled = computed(() => !validation.value.success)

const validationMessage = computed(() => {
  if (validation.value.success) return ''

  return validation.value.error.issues[0]?.message
})

function entrepriseSiretFound(entreprise: EntrepriseStateType) {
  state.siret = entreprise.siret
  state.nom = entreprise.nom
  state.nomEtab = entreprise.nomEtab
  state.adresse = entreprise.adresse
  state.ville = entreprise.ville
  state.codePostal = entreprise.codePostal

  state.pays = entreprise.pays
  state.etranger = entreprise.pays !== 'France'

  toast.add({
    title: 'Succès',
    description: `Les données de l'entreprise ${entreprise.nom} ont été récupérées avec succès.\nVérifiez les informations récuperées.`,
    color: 'success'
  })
}

const isLoading = ref(false)
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    const data = companyFields.safeParse(event.data)
    if (!data.success) throw new Error('Invalid data')

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
      description: 'Une erreur est survenue lors de la création de l\'entreprise.',
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
        :schema="companyFields"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField label="Nom de l'entreprise">
          <UInput
            v-model="state.nom"
            placeholder="Nom"
            class="w-full"
            required
            :minlength="2"
            :maxlength="100"
          />
        </UFormField>
        <UFormField label="Nom de l'établissement (optionnel)">
          <UInput
            v-model="state.nomEtab"
            placeholder="Nom"
            class="w-full"
            :maxlength="100"
          />
        </UFormField>
        <UFormField label="Adresse">
          <UInput
            v-model="state.adresse"
            placeholder="Adresse"
            class="w-full"
            :maxlength="200"
            required
          />
        </UFormField>
        <UFormField label="Code postal">
          <UInput
            v-model="state.codePostal"
            placeholder="Code postal"
            class="w-full"
            :maxlength="10"
          />
        </UFormField>
        <UFormField label="Ville">
          <UInput
            v-model="state.ville"
            placeholder="Ville"
            class="w-full"
            :maxlength="100"
            required
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
            color="primary"
            type="submit"
            form="create-company-form"
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
