<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import type { Departement } from '~~/generated/prisma/client.ts'
import type { DepartementUncheckedCreateInput } from '~~/generated/prisma/models'
import { nomDepartementSchema } from '~~/shared/schemas/department'

type DepartementType = Pick<Departement, 'idDepartement' | 'nom'>

const props = defineProps<{
  editDepartment?: DepartementType
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const isEditing = computed(() => !!props.editDepartment)

const schemaFields = z.object({
  nom: nomDepartementSchema
})

type Schema = z.output<typeof schemaFields>

const emit = defineEmits<{
  saved: [department: Departement]
}>()

type StateType = { nom: string }
function createDefaultState(): StateType {
  return { nom: props.editDepartment?.nom ?? '' }
}

const state = reactive<StateType>(createDefaultState())

function resetState() {
  state.nom = props.editDepartment?.nom ?? ''
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
    const url = isEditing.value
      ? `/api/departments/${props.editDepartment!.idDepartement}`
      : '/api/departments'

    const response = await $fetch<Departement>(url, {
      method: isEditing.value ? 'PATCH' : 'POST',
      body: { nom: state.nom } satisfies Pick<DepartementUncheckedCreateInput, 'nom'>
    })

    toast.add({
      title: isEditing.value ? 'Département mis à jour' : 'Département créé',
      description: `Le département ${response.nom} a été ${isEditing.value ? 'mis à jour' : 'créé'} avec succès.`,
      color: 'success',
      duration: isEditing.value ? 5_000 : 7_000,
      actions: isEditing.value
        ? []
        : [{
            color: 'neutral',
            variant: 'outline',
            icon: 'i-lucide-users',
            label: 'Ajouter une personne aux secrétariats',
            onClick: () => navigateTo(`/departments/${response.idDepartement}/secretariats`)
          }]
    })

    emit('saved', response)

    resetState()

    isOpen.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Erreur',
      description: isEditing.value ? 'Impossible de mettre à jour le département.' : 'Impossible de créer le département.',
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
    :title="isEditing ? `Modification du département ${props.editDepartment?.nom}` : 'Création d\'un département'"
    @update:open="(open) => { if (!open) resetState() }"
  >
    <UButton
      v-if="!isEditing"
      icon="i-lucide-plus"
    >
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
            :disabled="isSaveButtonDisabled"
            :loading="isLoading"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </UButton>
        </UTooltip>
      </div>
    </template>
  </UModal>
</template>
