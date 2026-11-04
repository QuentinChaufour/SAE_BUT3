<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod/v4'
import { Demarche_Source , Recherche_Stage_Status } from '~~/generated/prisma/enums'
import type { DemarcheContact } from '~~/generated/prisma/client'
import type { EventInfo } from '~~/shared/types/event'
import type { APIResponse } from '~~/shared/types/apiResponse'
import StatusBadge from '~/components/dossier/StatusBadge.vue'

type ContactItem = {
  value: number
  label: string
}

const event = defineModel<EventInfo>()

if (event.value && !event.value.files) {
  event.value.files = []
}

const props = withDefaults(defineProps<{
  dossierId: number
  creation?: boolean
}>(), {
  creation: false
})

const emit = defineEmits<{
  created: [EventInfo]
  deleted: []
  close: []
}>()

const contactsOptions = ref<DemarcheContact[]>([])
const contactsEvent = ref<DemarcheContact[]>(event.value?.contacts ?? [])
const loading = ref<boolean>(true)
const selectedContact = ref<ContactItem>()
const searchTermContact = ref<string>('')
const toast = useToast() 

const schema = z.object({
  titre: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'La date est invalide'
  }),
  status: z.enum(Recherche_Stage_Status),
  source: z.enum(Demarche_Source)
})

type EventSchema = z.output<typeof schema>

const state = reactive({
  titre: event.value?.titre || '',
  description: event.value?.description || '',
  date: event.value?.date ? event.value?.date : new Date().toISOString(),
  status: event.value?.status || Recherche_Stage_Status.AttenteEnvoi,
  source: event.value?.source || Demarche_Source.Autre
})

async function onSubmit(e: FormSubmitEvent<EventSchema>) {
  
  if(contactsEvent.value.length === 0) {
    // TODO error under the input
    throw new Error('Veuillez sélectionner au moins un contact pour l\'événement')
  }

  const response = props.creation ? await createEvent() : await updateEvent()

  if(!response) {
    toast.add({ title: 'Erreur', description: 'Erreur lors de la soumission de l\'événement', color: 'error' })
    return
  }

  if(props.creation){
    emit('created', response)
  }
  else {
    event.value = {
      ...response,
      contacts: contactsEvent.value
    }
  }
  toast.add({ title: 'Succès', description: 'Événement mis à jour avec succès', color: 'success' })
  emit('close')
}

async function updateEvent() {

  try{
    const response = await $fetch<APIResponse<EventInfo>>(`/api/dossier/${props.dossierId}/evenements/${event.value?.idDemarche}`, {
      method: 'PUT',
      body: {
        ...state,
        contacts: contactsEvent.value.map(contact => contact.idContact)
      }
    })

    if(!response.data || response.statusCode !== 200) {
      throw new Error('Erreur lors de la mise à jour de l\'événement')
    }

    return response.data
  }
  catch(error){
    toast.add({ title: 'Erreur', description: 'Erreur lors de la mise à jour de l\'événement', color: 'error' })
    console.error('Error updating event:', error)
  }
}

async function createEvent() {
  try{
    const response = await $fetch<APIResponse<EventInfo>>(`/api/dossier/${props.dossierId}/evenements`, {
      method: 'POST',
      body: {
        ...state,
        contacts: contactsEvent.value.map(contact => contact.idContact)
      }
    })

    if(!response.data || response.statusCode !== 201) {
      throw new Error('Erreur lors de la création de l\'événement')
    }

    return response.data
  }
  catch(error){
    toast.add({ title: 'Erreur', description: 'Erreur lors de la création de l\'événement', color: 'error' })
    console.error('Error creating event:', error)
  }
}

async function deleteEvent(){

  if(!event.value){
    toast.add({ title: 'Erreur', description: 'Aucun événement sélectionné pour la suppression', color: 'error' })
    return
  }

  if(confirm("Etes vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) {
    try{
      const response = await $fetch<APIResponse<EventInfo>>(`/api/dossier/${props.dossierId}/evenements/${event.value.idDemarche}`, {
        method: 'DELETE'
      })

      if(response.statusCode !== 204) {
        throw new Error('Erreur lors de la suppression de l\'événement')
      }

      toast.add({ title: 'Succès', description: 'Événement supprimé avec succès', color: 'success' })
      emit('deleted')
      emit('close')
    }
    catch(error){
      toast.add({ title: 'Erreur', description: 'Erreur lors de la suppression de l\'événement', color: 'error' })
      console.error('Error deleting event:', error)
    }
  }


}

async function fetchContacts() {
  try {
    const response = await $fetch<APIResponse<DemarcheContact[] | null>>(`/api/dossier/${props.dossierId}/contacts`, {
      method: 'GET',
    })
    contactsOptions.value = response.data ?? []
    loading.value = false
  } catch (error) {
    toast.add({ title: 'Erreur', description: 'Erreur lors de la récupération des contacts', color: 'error' })
  }
}

function createContact(){
  // TODO
}

function addContact(contactElement: {value: number, label: string}) {
  const contact = contactsOptions.value.find(c => c.idContact === contactElement.value)
  selectedContact.value = undefined

  if (!contact) {
    // TODO toast instead
    toast.add({ title: 'Erreur', description: `Contact ${contactElement.label} ne fait pas parti des contacts du dossier de recherche`, color: 'error' })
    return
  }

  // Prevent adding the same contact multiple times
  if(contactsEvent.value.some(c => c.idContact === contact.idContact)) {
    toast.add({ title: 'Erreur', description: `Contact ${contactElement.label} est déjà sélectionné`, color: 'error' })
    return
  }

  contactsEvent.value.push(contact)
}

function removeContact(contact: DemarcheContact) {
  contactsEvent.value = contactsEvent.value.filter(c => c.idContact !== contact.idContact)
}

onMounted(async () => {
  await fetchContacts()
})

</script>

<template>
  <div class="min-w-0 flex-2 mr-10 ml-10 space-y-5">

    <UButton
      :disabled="props.creation"
      icon="i-lucide-trash-2"
      label="Supprimer l'événement"
      color="error"
      size="sm"
      class="mb-4"
      @click="deleteEvent"
    />

    <UForm
      :schema="schema"
      :state="state"
      class=" flex flex-col mt-6 mb-5 min-w-0 space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Titre"
        name="titre"
      >
        <UInput
          class="w-full sm:w-auto"
          required
          v-model="state.titre"
        />
      </UFormField>
      <UFormField
        label="Description"
        name="description"
      >
        <UTextarea
          class="w-full sm:w-auto"
          v-model="state.description"
        />
      </UFormField>

      <UFormField
        label="Status de l'événement"
        name="status"
      >
        <USelect
          label="Status"
          name="status"
          :items="Object.values(Recherche_Stage_Status).map(status => ({ value: status, label: status }))"
          v-model="state.status"
        >
          <template #item="{ item }">
            <StatusBadge :status="item.value" />
          </template>
        </USelect>
      </UFormField>

      <UFormField
        label="Source"
        name="source"
      >
        <USelect
          label="Source de l'événement"
          name="source"
          :items="Object.values(Demarche_Source).map(source => ({ value: source, label: source }))"
          v-model="state.source"
        />
      </UFormField>

      <UFormField
        label="Contacts"
        name="contacts"
      >
        <UInputMenu
          v-model="selectedContact" 
          v-model:search-term="searchTermContact"
          :items="contactsOptions.map(contact => ({ value: contact.idContact, label: `${contact.nom} ${contact.prenom}` }))"
          :loading="loading"
          ignore-filter
          placeholder="Sélectionner un contact"
          class="w-full"
          create-item="always"
          @update:model-value="addContact"
          @create="createContact"
        />
      </UFormField>

      <div v-if="contactsEvent.length > 0">
        <div class="flex flex-col space-y-2">
          <p class="text-gray-500">Contacts associés à l'événement :</p>
          <ul class="list-disc list-inside">
            <li v-for="contact in contactsEvent" :key="contact.idContact">
              <p>{{ contact.nom }} {{ contact.prenom }}</p>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="link"
                size="xs"
                aria-label="Supprimer le contact"
                @click="removeContact(contact)"
              />
            </li>
          </ul>
        </div>
      </div>

      <div v-else>
        <p class="text-gray-500">Aucun contact sélectionné.</p>
      </div>

      <!-- TODO -->
      <UFileUpload
        label="Insérez vos fichier"
        description="Accepté : .pdf, .jpg, .png ..."
        layout="list"
        multiple
        class="w-fit"
      >
        <template #file-trailing="{ index }">
          <!-- TODO add download functionality -->
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="link"
            size="xs"
            aria-label="Delete file"
          />
        </template>
      </UFileUpload>
      
      <UButton type="submit" :label="props.creation ? 'Créer' : 'Modifier'"/>
    </UForm>
  </div>
</template>
