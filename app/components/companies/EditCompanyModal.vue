<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod/v4'
import type { Entreprise } from '~~/generated/prisma/client'
import { companyFields } from '~~/shared/schemas/company'

type Schema = z.output<typeof companyFields>

const props = defineProps<{
  editCompany?: Entreprise | null
  readOnly?: boolean
}>()

const emit = defineEmits<{
  saved: [entreprise: Entreprise]
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const isLoading = ref(false)
const toast = useToast()

type StateType = {
  nom: string
  nomEtab: string
  adresse: string
  ville: string
  codePostal: string
  siret: string
  pays: string
  etranger: boolean
}

function createDefaultState(): StateType {
  return {
    nom: props.editCompany?.nom ?? '',
    nomEtab: props.editCompany?.nomEtab ?? '',
    adresse: props.editCompany?.adresse ?? '',
    ville: props.editCompany?.ville ?? '',
    codePostal: props.editCompany?.codePostal ?? '',
    siret: props.editCompany?.siret ?? '',
    pays: props.editCompany?.pays ?? 'France',
    etranger: props.editCompany?.pays !== 'France'
  }
}

const state = reactive<StateType>(createDefaultState())

watch([isOpen, () => props.editCompany], ([open]) => {
  if (open) Object.assign(state, createDefaultState())
}, { deep: true })

const validation = computed(() => companyFields.safeParse(state))
const isSaveButtonDisabled = computed(() => !validation.value.success)
const validationMessage = computed(() => validation.value.success ? '' : validation.value.error.issues[0]?.message)

function switchEtranger(status: boolean) {
  state.pays = status ? '' : 'France'
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.editCompany || props.readOnly) return

  isLoading.value = true
  try {
    const data = companyFields.safeParse(event.data)
    if (!data.success) throw new Error('Invalid data')

    const response = await $fetch<Entreprise>(`/api/companies/${props.editCompany.idEntreprise}`, {
      method: 'PATCH',
      body: {
        nom: data.data.nom,
        nomEtab: data.data.nomEtab,
        adresse: data.data.adresse,
        ville: data.data.ville,
        codePostal: data.data.codePostal,
        siret: data.data.siret,
        pays: data.data.pays
      }
    })

    toast.add({
      title: 'Entreprise mise à jour',
      description: `L'entreprise ${response.nom} a été mise à jour avec succès.`,
      color: 'success'
    })

    emit('saved', response)
    isOpen.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Erreur',
      description: 'Impossible de mettre à jour l\'entreprise.',
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
    :title="readOnly ? `Informations sur l'entreprise ${props.editCompany?.nom}` : 'Modification d\'une entreprise'"
  >
    <template #body>
      <UForm
        id="edit-company-form"
        class="flex flex-col gap-3"
        :schema="companyFields"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField label="Nom de l'entreprise">
          <UInput
            v-model="state.nom"
            class="w-full"
            :minlength="2"
            :maxlength="100"
            required
            :readonly="readOnly"
          />
        </UFormField>
        <UFormField label="Nom de l'établissement (optionnel)">
          <UInput
            v-model="state.nomEtab"
            class="w-full"
            :maxlength="100"
            :readonly="readOnly"
          />
        </UFormField>
        <UFormField label="Adresse">
          <UInput
            v-model="state.adresse"
            class="w-full"
            :maxlength="200"
            required
            :readonly="readOnly"
          />
        </UFormField>
        <UFormField label="Code postal">
          <UInput
            v-model="state.codePostal"
            class="w-full"
            :maxlength="10"
            :readonly="readOnly"
          />
        </UFormField>
        <UFormField label="Ville">
          <UInput
            v-model="state.ville"
            class="w-full"
            :maxlength="100"
            required
            :readonly="readOnly"
          />
        </UFormField>
        <UFormField
          label="Entreprise étrangère"
          class="mt-2"
        >
          <USwitch
            v-model="state.etranger"
            label="L'entreprise est-elle à l'étranger ?"
            :disabled="readOnly"
            @update:model-value="switchEtranger"
          />
        </UFormField>
        <UFormField
          v-if="state.etranger"
          label="Pays"
        >
          <UInput
            v-model="state.pays"
            class="w-full"
            :maxlength="100"
            required
            :readonly="readOnly"
          />
        </UFormField>
      </UForm>
    </template>

    <template
      v-if="!readOnly"
      #footer
    >
      <div class="flex w-full justify-end">
        <UTooltip
          :text="validationMessage"
          :disabled="!validationMessage"
        >
          <UButton
            color="primary"
            type="submit"
            form="edit-company-form"
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
