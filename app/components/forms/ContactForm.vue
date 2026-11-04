<script setup lang="ts">
import type { z } from 'zod/v4'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ContactInfo } from '~~/shared/types/contact'
import { contactSchema } from '~~/shared/schemas/contact'

type responseCreateContact = {
  success: boolean
  data?: ContactInfo
}

// Define the props for the component
// The component can be used in two modes: create or update
type CreateProps = {
  create: true
  update?: false

  // required only in create mode
  eventId: number
  dossierId: number
}

type UpdateProps = {
  update: true
  create?: false

  // required only in update mode
  contact: ContactInfo
}

type Schema = z.output<typeof contactSchema>

const props = defineProps<CreateProps | UpdateProps>()
const emit = defineEmits<{
  submitted: [payload: Schema & { idContact: number }]
}>()

const isUpdateMode = props.update === true

const state = reactive({
  idContact: isUpdateMode ? props.contact.idContact : null,
  nom: isUpdateMode ? props.contact.nom : '',
  prenom: isUpdateMode ? props.contact.prenom || '' : '',
  email: isUpdateMode ? props.contact.email || '' : '',
  telephone: isUpdateMode ? props.contact.telephone || '' : '',
  fonction: isUpdateMode ? props.contact.fonction || '' : ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (props.update) {
    await updateContact(event)
  } else {
    await createContact(event)
  }
}

async function updateContact(event: FormSubmitEvent<Schema>) {
  try {

    if (!isUpdateMode || !props.contact) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Contact is required for updating'
      })
    }

    const response = await $fetch<responseCreateContact>(`/api/dossier/contact/${props.contact.idContact}`, {
      method: 'PATCH',
      body: state
    })

    if (!response) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update contact'
      })
    }

    emit('submitted', { ...state, idContact: props.contact.idContact })
  } catch (error) {
    // TODO: handle error properly, maybe show a notification to the user
    console.error('Error updating contact:', error)
  }
}

async function createContact(event: FormSubmitEvent<Schema>) {
  try {
    const hasCreateMode = props.create === true

    if (!hasCreateMode || !props.eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required for creating a contact'
      })
    }

    const response = await $fetch<responseCreateContact>(`/api/dossier/${props.dossierId}/evenements/${props.eventId}/contact`, {
      method: 'POST',
      body: state
    })

    if (!response.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create contact'
      })
    }
    state.idContact = response.data?.idContact || 0
    emit('submitted', { ...state, idContact: state.idContact })
  } catch (error) {
    // TODO: handle error properly, maybe show a notification to the user
    console.error('Error creating contact:', error)
  }
}
</script>

<template>
  <UForm
    :schema="contactSchema"
    :state="state"
    class=" mt-6 mb-5 min-w-0 space-y-2"
    @submit="onSubmit"
  >
    <UFormField
      label="Nom"
      name="nom"
    >
      <UInput
        v-model="state.nom"
        type="text"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Prénom"
      name="prenom"
    >
      <UInput
        v-model="state.prenom"
        type="text"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Fonction"
      name="fonction"
    >
      <UInput
        v-model="state.fonction"
        type="text"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Téléphone"
      name="telephone"
    >
      <UInput
        v-model="state.telephone"
        type="tel"
        class="w-full"
        placeholder="+33 06 00 00 00 00"
      />
    </UFormField>

    <UFormField
      label="Mail"
      name="email"
    >
      <UInput
        v-model="state.email"
        type="email"
        class="w-full"
      />
    </UFormField>

    <UButton type="submit" :label="props.create ? 'Créer' : 'Modifier'"/>
  </UForm>
</template>
