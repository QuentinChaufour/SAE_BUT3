<script setup lang="ts">
import type { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Departement, Personnel } from '~~/generated/prisma/client.ts'
import { personnelBodySchema } from '~~/shared/schemas/personnel.ts'
import PersonnelInput, { type PersonnelOption } from './PersonnelInput.vue'
import { FetchError } from 'ofetch'

const personnelFormSchema = personnelBodySchema.pick({
  numPersonnel: true,
  nom: true,
  prenom: true
})

type Schema = z.output<typeof personnelFormSchema>

const props = defineProps<
  | { type: 'admin' }
  | { type: 'secretariat', department: Departement }
>()

const emit = defineEmits<{
  created: [personnel: Pick<Personnel, 'numPersonnel' | 'nom' | 'prenom'>]
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const toast = useToast()

const isLoading = ref(false)
const formRef = useTemplateRef('form')
const isExistingPersonnel = ref(false)
const state = reactive<Schema>(createDefaultState())

function createDefaultState(): Schema {
  return {
    numPersonnel: '',
    nom: '',
    prenom: ''
  }
}

watch(isOpen, (open) => {
  if (open) {
    Object.assign(state, createDefaultState())
    isExistingPersonnel.value = false
  }
})

const validation = computed(() => personnelFormSchema.safeParse(state))
const isAddButtonDisabled = computed(() => !validation.value.success)
const validationMessage = computed(() => {
  if (validation.value.success) return ''
  return validation.value.error.issues[0]?.message
})

function onPersonnelSelected(personnel: PersonnelOption | null) {
  isExistingPersonnel.value = personnel?.existing ?? false

  state.nom = personnel?.nom ?? ''
  state.prenom = personnel?.prenom ?? ''

  formRef.value?.validate({ name: 'numPersonnel' }).catch(() => null)
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  isLoading.value = true

  try {
    if (props.type === 'secretariat' && isExistingPersonnel.value) {
      await $fetch(`/api/personnels/${encodeURIComponent(state.numPersonnel)}/departments`, {
        method: 'POST',
        body: { departement_id: props.department.idDepartement }
      })
    } else {
      await $fetch('/api/personnels', {
        method: 'POST',
        body: {
          numPersonnel: state.numPersonnel,
          nom: state.nom,
          prenom: state.prenom,
          role: props.type,
          department_ids: props.type === 'secretariat' ? [props.department.idDepartement] : undefined
        }
      })
    }

    toast.add({
      title: 'Personnel ajouté',
      description: props.type === 'secretariat'
        ? `${state.prenom} ${state.nom} a été ajouté au département ${props.department.nom}.`
        : `${state.prenom} ${state.nom} a été ajouté comme administrateur.`,
      color: 'success'
    })

    emit('created', { numPersonnel: state.numPersonnel, nom: state.nom, prenom: state.prenom })

    isOpen.value = false
  } catch (error) {
    let description = 'Une erreur est survenue lors de l\'ajout du personnel.'
    if (error instanceof FetchError && error.response?.status === 409) {
      description = 'Le numéro de personnel donné existe déjà.'
    } else {
      console.error(error)
    }

    toast.add({ title: 'Erreur', description, color: 'error' })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="props.type === 'admin' ? 'Ajout d\'un administrateur' : 'Ajout d\'un personnel du secrétariat'"
  >
    <UButton icon="i-lucide-plus">
      Ajouter
    </UButton>

    <template #body>
      <UForm
        id="add-personnel-form"
        ref="form"
        class="flex flex-col gap-3"
        :schema="personnelFormSchema"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField
          label="Numéro du personnel"
          name="numPersonnel"
          :help="type === 'secretariat' ? 'Sélectionnez un personnel existant ou saisissez un nouveau numéro.' : undefined"
        >
          <PersonnelInput
            v-if="type === 'secretariat'"
            v-model="state.numPersonnel"
            role="secretariat"
            @select="onPersonnelSelected"
          />
          <UInput
            v-else
            v-model="state.numPersonnel"
            placeholder="Numéro du personnel"
            class="w-full"
            :maxlength="50"
            required
          />
        </UFormField>

        <UAlert
          v-if="isExistingPersonnel"
          description="Ce personnel existe déjà, ses informations ne peuvent pas être modifiées depuis ce formulaire."
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
        />

        <UFormField
          label="Nom"
          name="nom"
        >
          <UInput
            v-model="state.nom"
            placeholder="Nom"
            class="w-full"
            :disabled="isExistingPersonnel"
            :maxlength="100"
            required
          />
        </UFormField>

        <UFormField
          label="Prénom"
          name="prenom"
        >
          <UInput
            v-model="state.prenom"
            placeholder="Prénom"
            class="w-full"
            :disabled="isExistingPersonnel"
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
            form="add-personnel-form"
            :disabled="isAddButtonDisabled"
            :loading="isLoading"
          >
            Ajouter
          </UButton>
        </UTooltip>
      </div>
    </template>
  </UModal>
</template>
