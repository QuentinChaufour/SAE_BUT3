<script setup lang="ts">
import { z } from 'zod/v4'
import { CalendarDate, parseDate } from '@internationalized/date'
import { DetailStatus } from '~/utils/RechercheStatusDetails'
import { DetailsSource } from '~/utils/RechercheSourceDetails'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'
import type { DemarcheContact } from '~~/generated/prisma/client'
import type { EventInfo } from '~~/shared/types/event'

import StatusBadge from '~/components/dossier/StatusBadge.vue'
import ContactForm from '../forms/ContactForm.vue'
import ContactCard from '~/components/common/ContactCard.vue'
import ConfirmModal from '~/components/common/ConfirmModal.vue'
import FileDetails from '~/components/dossier/FileDetails.vue'

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

const props = withDefaults(defineProps<(CreateProps | UpdateProps) & { readOnly?: boolean }>(), {
  readOnly: false
})

const emits = defineEmits<{
  created: [EventInfo, File[]]
  updated: [EventInfo, File[]]
  deleted: []
  close: []
}>()

const dossierStore = useDossierStore()

const contactsOptions = ref<DemarcheContact[]>([])
const contactsEvent = ref<DemarcheContact[]>(props.creation ? [] : props.event?.contacts || [])
const filesToDelete = ref<EventFile[]>([])
const loading = ref<boolean>(true)
const selectedContact = ref<ContactItem>()
const searchTermContact = ref<string>('')
const isCreatingContact = ref<boolean>(false)
const isContactSelectorOpen = ref<boolean>(false)
const isConfirmModalOpen = ref<boolean>(false)
const inputDateTemplate = useTemplateRef('inputDate')

const files = ref<File[]>([])
const toast = useToast()

const schema = z.object({
  titre: z.string(),
  description: z.string(),
  status: z.enum(Recherche_Stage_Status).nonoptional(),
  source: z.enum(Demarche_Source).optional().default(Demarche_Source.Email)
})
const today = () => {
  const date = new Date()
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

const state = reactive<{
  titre: string
  description: string
  status: Recherche_Stage_Status
  source: Demarche_Source
}>({
  titre: props.creation ? props.state?.titre || '' : props.event?.titre || '',
  description: props.creation ? props.state?.description || '' : props.event?.description || '',
  status: props.creation ? props.state?.status || Recherche_Stage_Status.AttenteEnvoi : props.event?.status || Recherche_Stage_Status.AttenteEnvoi,
  source: props.creation ? props.state?.source || Demarche_Source.Autre : props.event?.source || Demarche_Source.Autre
})

// Only keep the date part of the ISO string, and parse it to a CalendarDate object
const date = shallowRef<CalendarDate>(
  props.creation
    ? props.state?.date
      ? parseDate(props.state.date.split('T')[0]!)
      : today()
    : props.event?.date ? parseDate(props.event.date.split('T')[0]!) : today())

const options = computed(() => contactsOptions.value.map(contact => ({ value: contact.idContact, label: `${contact.nom} ${contact.prenom}` })).filter(contact => contact.label.toLowerCase().includes(searchTermContact.value.toLowerCase())))

async function onSubmit() {
  if (props.creation) {
    const response = createEvent()

    if (!response) {
      toast.add({ title: 'Erreur', description: 'Erreur lors de la soumission de l\'événement', color: 'error' })
      return
    }

    emits('created', response, files.value)
  } 
  else {
    if (!props.event) {
      return
    }
    
    const response = updateEvent()

    if (!response) {
      return
    }

    await Promise.all(filesToDelete.value.map(file => deleteFile(file)))

    emits('updated', response, files.value)
  }
  toast.add({ title: 'Succès', description: props.creation ? 'Événement créé avec succès' : 'Événement mis à jour avec succès', color: 'success' })
  emits('close')
}

function createEvent() {
  if (!props.creation) return

  return {
    ...state,
    idDemarche: 0,
    date: date.value.toString(),
    contacts: contactsEvent.value.map(contact => ({
      ...contact,
      label: `${contact.prenom} ${contact.nom}`.trim() || 'Pas de nom',
      value: String(contact.idContact),
      content: ''
    }))
  }
}

function updateEvent() {
  if (props.creation) return

  return {
    ...props.event,
    ...state,
    date: date.value.toString(),
    contacts: contactsEvent.value.map(contact => ({
      ...contact,
      label: `${contact.prenom} ${contact.nom}`.trim() || 'Pas de nom',
      value: String(contact.idContact),
      content: ''
    }))
  }
}

async function deleteEvent() {
  if (!props.creation && !props.event) {
    toast.add({ title: 'Erreur', description: 'Aucun événement sélectionné pour la suppression', color: 'error' })
    return
  }

  emits('deleted')
  isConfirmModalOpen.value = false
}

function createdContact(contact: DemarcheContact) {
  contactsOptions.value.push(contact)
  contactsEvent.value.push(contact)

  // réinitialiser les champs du formulaire de contact
  selectedContact.value = undefined
  searchTermContact.value = ''

  isCreatingContact.value = false
  isContactSelectorOpen.value = false
}

function addContact(contactElement: { value: number, label: string }) {
  const contact = contactsOptions.value.find(c => c.idContact === contactElement.value)
  selectedContact.value = undefined

  if (!contact) {
    toast.add({ title: 'Erreur', description: `Contact ${contactElement.label} ne fait pas parti des contacts du dossier de recherche`, color: 'error' })
    return
  }

  // Prevent adding the same contact multiple times
  if (contactsEvent.value.some(c => c.idContact === contact.idContact)) {
    return
  }

  contactsEvent.value.push(contact)
  isContactSelectorOpen.value = false
  searchTermContact.value = ''
}

function removeContact(contact: DemarcheContact) {
  contactsEvent.value = contactsEvent.value.filter(c => c.idContact !== contact.idContact)
}

function updateTitle() {
  // Update the title only if not a custom title inserted by the user
  if (state.titre.trim() === '' || Object.values(DetailStatus).some(s => s.label === state.titre)) {
    state.titre = DetailStatus[state.status]?.label || state.titre
  }
}

async function downloadFile(file: EventFile) {
  
  if(props.creation || !props.event) {
    toast.add({ title: 'Erreur', description: 'Aucun événement sélectionné pour le téléchargement du fichier', color: 'error' })
    return
  }

  try {
    const blob = await dossierStore.downloadFile(file, props.event.idDemarche, props.dossierId)
    
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  } 
  catch (error) {
    console.error('Error downloading file:', error)
    toast.add({ title: 'Erreur', description: 'Erreur lors du téléchargement du fichier', color: 'error' })
    return
  }
}

async function deleteFile(file: EventFile) {

  if(props.creation || !props.event) {
    toast.add({ title: 'Erreur', description: 'Aucun événement sélectionné pour la suppression du fichier', color: 'error' })
    return
  }

  try{
    await dossierStore.deleteFile(file, props.event?.idDemarche!, props.dossierId)
    toast.add({ title: 'Succès', description: 'Fichier supprimé avec succès', color: 'success' })
  }
  catch (error) {
    console.error('Error deleting file:', error)
    toast.add({ title: 'Erreur', description: 'Erreur lors de la suppression du fichier', color: 'error' })
    return
  }
  
}

onMounted(async () => {
  loading.value = true
  try {
    contactsOptions.value = await dossierStore.fetchContacts()
  } catch (error) {
    console.error('Error fetching contacts:', error)
    toast.add({ title: 'Erreur', description: 'Erreur lors de la récupération des contacts', color: 'error' })
  }
  loading.value = false
})
</script>

<template>
  <div class="min-w-0 mr-5 ml-5">
    <div
      v-if="!creation && !readOnly"
      class="flex justify-end"
    >
      <UTooltip
        text="Supprimer l'événement"
        placement="bottom"
      >
        <UButton
          :disabled="props.creation"
          icon="i-lucide-trash-2"
          color="error"
          size="lg"
          @click="isConfirmModalOpen = true"
        />
      </UTooltip>
    </div>

    <!-- eslint-disable vue/no-parsing-error -->
    <UForm
      :schema="schema"
      :state="state"
      class=" flex flex-col mb-5 min-w-0 space-y-4"
      @[!readOnly&&'submit']="onSubmit"
    >
      <!-- eslint-enable vue/no-parsing-error -->
      <UFormField
        label="Status de l'événement"
        name="status"
        class="min-w-[80%]"
        required
      >
        <USelect
          v-model="state.status"
          label="Status"
          name="status"
          class="w-full"
          :disabled="readOnly"
          :ui="{ value: 'w-full' }"
          :items="Object.values(Recherche_Stage_Status).map(status => ({ value: status, label: status }))"
          @change="updateTitle"
        >
          <template #default>
            <p class="justify-self-start">
              {{ DetailStatus[state.status]?.label }}
            </p>
          </template>
          <template #item="{ item }">
            <StatusBadge
              :status="item.value"
              class="w-full"
              :size="'lg'"
            />
          </template>
        </USelect>
      </UFormField>

      <UFormField
        label="Titre"
        name="titre"
        class="min-w-[80%]"
        description="Par défaut, prend la valeur du status de l'événement."
      >
        <UInput
          v-model="state.titre"
          class="w-full"
          placeholder="Dépôt de candidature"
          :disabled="readOnly"
          @blur="updateTitle"
        />
      </UFormField>

      <UFormField
        label="Description"
        name="description"
        class="min-w-[80%]"
      >
        <UTextarea
          v-model="state.description"
          class="w-full"
          :disabled="readOnly"
          placeholder="envoie de la candidature, relance, entretien, etc..."
        />
      </UFormField>

      <div class="flex flex-nowrap justify-around gap-10">
        <UFormField
          label="Date"
          name="date"
          class="flex-1"
          required
        >
          <UInputDate
            ref="inputDate"
            v-model="date"
            class="w-full"
            locale="fr-FR"
            :range="false"
            :disabled="readOnly"
            required
          >
            <template #trailing>
              <UPopover :reference="inputDateTemplate?.inputsRef[3]?.$el">
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-lucide-calendar"
                  aria-label="Select a date"
                  class="px-0"
                />

                <template #content>
                  <UCalendar
                    v-model="date"
                    :range="false"
                    class="p-2"
                    locale="fr-Fr"
                  />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <UFormField
          label="Source de l'événement"
          name="source"
          class="flex-1"
        >
          <USelect
            v-model="state.source"
            label="Source de l'événement"
            name="source"
            :disabled="readOnly"
            class="w-full"
            :items="Object.values(Demarche_Source).map(source => ({ value: source, label: DetailsSource[source]?.label || source }))"
          />
        </UFormField>
      </div>

      <USeparator />

      <UFormField
        label="Contacts"
        name="contacts"
        description="Ajoutez les contacts impliqués dans l’événement. Recherchez un contact existant ou saisissez un prénom pour en créer un nouveau."
      >
        <UInputMenu
          v-model="selectedContact"
          v-model:search-term="searchTermContact"
          v-model:open="isContactSelectorOpen"
          :items="options"
          :loading="loading"
          ignore-filter
          placeholder="Rechercher ou créer un contact"
          class="w-full"
          create-item="always"
          :disabled="readOnly"
          @update:model-value="addContact"
          @create="isCreatingContact = true"
        >
          <template #create-item-label>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-plus"
                class="size-4 text-primary-600"
              />
              <span>Créer un contact : {{ searchTermContact }}</span>
            </div>
          </template>
        </UInputMenu>
      </UFormField>

      <div
        v-if="contactsEvent.length > 0"
        class="mt-4"
      >
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Contacts associés à l’événement
        </p>

        <ul class="space-y-3">
          <li
            v-for="contact in contactsEvent"
            :key="contact.idContact"
            class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-0.5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <ContactCard :contact="contact" />

            <UButton
              v-if="!readOnly"
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              size="lg"
              aria-label="Supprimer le contact"
              @click="removeContact(contact)"
            />
          </li>
        </ul>
      </div>

      <div
        v-else
        class="emptyDataPlaceholder"
      >
        <p class="text-sm text-gray-500">
          Aucun contact sélectionné.
        </p>
      </div>

      <USeparator />

      <UFormField
        label="Fichiers"
        name="files"
        description="Ajoutez des fichiers liés à l’événement (e.g. Votre CV,LM, une capture d'écran). Vous pouvez télécharger plusieurs fichiers à la fois."
      >
        <UFileUpload
          v-model="files"
          label="Insérez vos fichier"
          description="Accepté : .pdf, .jpg, .png ..."
          accept="image/*, application/pdf"
          layout="list"
          multiple
          :disabled="readOnly"
        />
        <FileDetails
          v-if="!creation && event?.files"
          v-model="filesToDelete"
          :files="event.files"
          :event-id="event.idDemarche"
          :dossier-id="dossierId"
          :read-only="readOnly"
          @download="downloadFile"
        />
      </UFormField>

      <div
        v-if="!readOnly"
        class="mt-6 flex justify-center border-t border-gray-200 pt-4 dark:border-gray-700"
      >
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
          :dossier-id="props.dossierId"
          :state="{ prenom: searchTermContact }"
          @created="createdContact"
          @cancel="() => {
            isCreatingContact = false
            isContactSelectorOpen = false
            searchTermContact = ''
          }"
        />
      </div>
    </template>
  </UModal>

  <ConfirmModal
    v-model:open="isConfirmModalOpen"
    title="Confirmer la suppression"
    description="Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible."
    @confirm="deleteEvent"
    @cancel="isConfirmModalOpen = false"
  />
</template>
