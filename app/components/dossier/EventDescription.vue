<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod/v4'
import { getCurrentDateString } from '~~/shared/utils/date'
import { Demarche_Source , Recherche_Stage_Status } from '~~/generated/prisma/enums'
import type { DemarcheContact } from '~~/generated/prisma/client'
import type { EventInfo } from '~~/shared/types/event'
import type { APIResponse } from '~~/shared/types/apiResponse'
import StatusBadge from '~/components/dossier/StatusBadge.vue'
import ContactForm from '../forms/ContactForm.vue'

type ContactItem = {
  value: number
  label: string
}

type CreateProps = {
  dossierId: number
  creation?: true

  // prefilled values for the form in create mode
  state?: Partial<EventInfo>
}

type UpdateProps = {
  dossierId: number
  creation?: false
  event: EventInfo
}

const props = defineProps<CreateProps | UpdateProps>()

const emits = defineEmits<{
  created: [EventInfo]
  updated: [EventInfo]
  deleted: []
  close: []
}>()

const contactsOptions = ref<DemarcheContact[]>([])
const contactsEvent = ref<DemarcheContact[]>(props.creation ? [] : props.event?.contacts || [])
const loading = ref<boolean>(true)
const selectedContact = ref<ContactItem>()
const searchTermContact = ref<string>('')
const isCreatingContact = ref<boolean>(false) 
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
  titre: props.creation ? props.state?.titre || '' : props.event?.titre || '',
  description: props.creation ? props.state?.description || '' : props.event?.description || '',
  date: props.creation ? props.state?.date || getCurrentDateString() : props.event?.date ? props.event?.date : getCurrentDateString(),
  status: props.creation ? props.state?.status || Recherche_Stage_Status.AttenteEnvoi : props.event?.status || Recherche_Stage_Status.AttenteEnvoi,
  source: props.creation ? props.state?.source || Demarche_Source.Autre : props.event?.source || Demarche_Source.Autre
})

async function onSubmit(e: FormSubmitEvent<EventSchema>) {
  if(props.creation){
    const response = createEvent()
    
    if(!response) {
      toast.add({ title: 'Erreur', description: 'Erreur lors de la soumission de l\'événement', color: 'error' })
      return
    }

    emits('created', response)
  }
  else {
    if(!props.event) {
      return
    }

    const response = updateEvent()
    if(!response) {
      toast.add({ title: 'Erreur', description: 'Erreur lors de la soumission de l\'événement', color: 'error' })
      return
    }

    emits('updated', response)
  }
  toast.add({ title: 'Succès', description: 'Événement mis à jour avec succès', color: 'success' })
  emits('close')
}

function createEvent() {
  if(!props.creation) return

  return {
    ...state,
    idDemarche: 0,
    contacts: contactsEvent.value.map(contact => ({
      ...contact,
      label: `${contact.nom} ${contact.prenom}`.trim() || 'Pas de nom',
      value: String(contact.idContact),
      content: ''
    }))
  }  
}

function updateEvent(){
  if(props.creation) return

  return {
    ...props.event,
    ...state,
    contacts: contactsEvent.value.map(contact => ({
      ...contact,
      label: `${contact.nom} ${contact.prenom}`.trim() || 'Pas de nom',
      value: String(contact.idContact),
      content: ''
    }))
  }
}

async function deleteEvent(){

  if(!props.creation && !props.event){
    toast.add({ title: 'Erreur', description: 'Aucun événement sélectionné pour la suppression', color: 'error' })
    return
  }

  if(confirm("Etes vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.")) {
    emits('deleted')
  }
}

async function fetchContacts() {
  try {
    const response = await $fetch<APIResponse<DemarcheContact[]>>(`/api/dossier/${props.dossierId}/contacts`, {
      method: 'GET',
    })
    contactsOptions.value = response.data ?? []
    loading.value = false
  } catch (error) {
    toast.add({ title: 'Erreur', description: 'Erreur lors de la récupération des contacts', color: 'error' })
  }
}

function createdContact(contact: DemarcheContact) {

  const newContact = {
    ...contact,
    label: `${contact.nom} ${contact.prenom}`.trim() || 'Pas de nom',
    value: String(contact.idContact),
    content: ''
  }

  contactsOptions.value.push(newContact)
  contactsEvent.value.push(newContact)


  // réinitialiser les champs du formulaire de contact
  selectedContact.value = undefined
  searchTermContact.value = ''

  isCreatingContact.value = false
}

function addContact(contactElement: {value: number, label: string}) {
  const contact = contactsOptions.value.find(c => c.idContact === contactElement.value)
  selectedContact.value = undefined

  if (!contact) {
    toast.add({ title: 'Erreur', description: `Contact ${contactElement.label} ne fait pas parti des contacts du dossier de recherche`, color: 'error' })
    return
  }

  // Prevent adding the same contact multiple times
  if(contactsEvent.value.some(c => c.idContact === contact.idContact)) {
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
    <div class="flex justify-end">
      <UTooltip text="Supprimer l'événement" placement="bottom">
        <UButton
          :disabled="props.creation"
          icon="i-lucide-trash-2"
          color="error"
          size="lg"
          class="mb-4"
          @click="deleteEvent"
        />
      </UTooltip>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class=" flex flex-col mt-6 mb-5 min-w-0 space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Titre"
        name="titre"
        :size="'xl'"
        required
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
        class="min-w-[80%]"
      >
        <UTextarea
          class="w-full"
          v-model="state.description"
        />
      </UFormField>


      <div class="flex flex-nowrap justify-around gap-10">
        <UFormField
          label="Status de l'événement"
          name="status"
          class="flex-1"
        >
          <USelect
            label="Status"
            name="status"
            class="w-full"
            :items="Object.values(Recherche_Stage_Status).map(status => ({ value: status, label: status }))"
            v-model="state.status"
          >
            <template #item="{ item }">
              <StatusBadge :status="item.value" />
            </template>
          </USelect>
        </UFormField>

        <UFormField
          label="Source de l'événement"
          name="source"
          class="flex-1"
        >
          <USelect
            label="Source de l'événement"
            name="source"
            class="w-full"
            :items="Object.values(Demarche_Source).map(source => ({ value: source, label: source }))"
            v-model="state.source"
          />
        </UFormField>
      </div>

      <USeparator/>

      <UFormField
        label="Contacts"
        name="contacts"
        description="Ajoutez les contacts impliqués dans l’événement. Recherchez un contact existant ou saisissez un prénom pour en créer un nouveau."
      >
        <UInputMenu
          v-model="selectedContact" 
          v-model:search-term="searchTermContact"
          :items="contactsOptions.map(contact => ({ value: contact.idContact, label: `${contact.nom} ${contact.prenom}` })).filter(contact => contact.label.toLowerCase().includes(searchTermContact.toLowerCase()))"
          
          :loading="loading"
          ignore-filter
          placeholder="Rechercher ou créer un contact"
          class="w-full"
          create-item="always"
          @update:model-value="addContact"
          @create="isCreatingContact = true"
        />
      </UFormField>

      <div v-if="contactsEvent.length > 0" class="mt-4">
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Contacts associés à l’événement
        </p>

        <ul class="space-y-2">
          <li
            v-for="contact in contactsEvent"
            :key="contact.idContact"
            class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-0.5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-200"
              >
                {{ contact.prenom?.charAt(0) }}{{ contact.nom.charAt(0) }}
              </div>

              <div class="min-w-0">
                <p class="truncate font-medium text-gray-900 dark:text-white">
                  {{ contact.prenom || 'Mr./Mme.' }} {{ contact.nom }}
                </p>
                <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                  {{ contact.fonction || 'Fonction inconnue' }}
                </p>
              </div>
            </div>

            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              aria-label="Supprimer le contact"
              @click="removeContact(contact)"
            />
          </li>
        </ul>
      </div>

      <div v-else class="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <p class="text-sm text-gray-500">
          Aucun contact sélectionné.
        </p>
      </div>

      <USeparator />

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
      
      <div class="mt-6 flex justify-center border-t border-gray-200 pt-4 dark:border-gray-700">
        <UButton
          type="submit"
          :label="props.creation ? 'Créer l’événement' : 'Enregistrer les modifications'"
          color="primary"
          size="md"
          class="w-fit"
        />
      </div>
    </UForm>
  </div>


  <UModal
    v-model:open="isCreatingContact"
  >
    <template #content>
      <div class="p-5">
        <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
          Créer un nouveau contact
        </h3>

        <ContactForm
          create
          @created="createdContact"
          :state="{prenom: searchTermContact}"
        />
    
        <UButton label="annuler" @click="isCreatingContact=false"/>
      </div>
    </template>
  </UModal>
</template>
