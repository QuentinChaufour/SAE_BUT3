<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod/v4'
import { DetailStatus } from '~/utils/RechercheStatusDetails'
import { DetailsSource } from '~/utils/RechercheSourceDetails'
import { getCurrentDateString } from '~~/shared/utils/date'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'
import type { DemarcheContact } from '~~/generated/prisma/client'
import type { EventInfo } from '~~/shared/types/event'
import StatusBadge from '~/components/dossier/StatusBadge.vue'
import ContactForm from '../forms/ContactForm.vue'
import ContactCard from '~/components/common/ContactCard.vue'

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

const dossierStore = useDossierStore()

const contactsOptions = ref<DemarcheContact[]>([])
const contactsEvent = ref<DemarcheContact[]>(props.creation ? [] : props.event?.contacts || [])
const loading = ref<boolean>(true)
const selectedContact = ref<ContactItem>()
const searchTermContact = ref<string>('')
const isCreatingContact = ref<boolean>(false)
const isContactSelectorOpen = ref<boolean>(false)
const toast = useToast()

const schema = z.object({
  titre: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string(),
  date: z.string().refine(date => !isNaN(Date.parse(date)), {
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

const options = computed(() => contactsOptions.value.map(contact => ({ value: contact.idContact, label: `${contact.nom} ${contact.prenom}` })).filter(contact => contact.label.toLowerCase().includes(searchTermContact.value.toLowerCase())))

async function onSubmit(_e: FormSubmitEvent<EventSchema>) {
  if (props.creation) {
    const response = createEvent()

    if (!response) {
      toast.add({ title: 'Erreur', description: 'Erreur lors de la soumission de l\'événement', color: 'error' })
      return
    }

    emits('created', response)
  } else {
    if (!props.event) {
      return
    }

    const response = updateEvent()

    if (!response) {
      return
    }

    emits('updated', response)
  }
  toast.add({ title: 'Succès', description: props.creation ? 'Événement créé avec succès' : 'Événement mis à jour avec succès', color: 'success' })
  emits('close')
}

function createEvent() {
  if (!props.creation) return

  return {
    ...state,
    idDemarche: 0,
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

  if (!confirm('Etes vous sûr de vouloir mettre à jour cet événement ?')) {
    return
  }

  return {
    ...props.event,
    ...state,
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

  if (confirm('Etes vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
    emits('deleted')
  }
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

// TODO  add calendar

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
    <div class="flex justify-end">
      <UTooltip
        text="Supprimer l'événement"
        placement="bottom"
      >
        <UButton
          :disabled="props.creation"
          icon="i-lucide-trash-2"
          color="error"
          size="lg"
          @click="deleteEvent"
        />
      </UTooltip>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class=" flex flex-col mb-5 min-w-0 space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Titre"
        name="titre"
        class="min-w-[80%]"
        required
      >
        <UInput
          v-model="state.titre"
          class="w-full"
          required
          placeholder="Dépôt de candidature"
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
          placeholder="envoie de la candidature, relance, entretien, etc..."
        />
      </UFormField>

      <div class="flex flex-nowrap justify-around gap-10">
        <UFormField
          label="Status de l'événement"
          name="status"
          class="flex-1"
        >
          <USelect
            v-model="state.status"
            label="Status"
            name="status"
            class="w-full"
            :ui="{ value: 'w-full' }"
            :items="Object.values(Recherche_Stage_Status).map(status => ({ value: status, label: status }))"
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
          label="Source de l'événement"
          name="source"
          class="flex-1"
        >
          <USelect
            v-model="state.source"
            label="Source de l'événement"
            name="source"
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

      <!-- TODO -->
      <UFormField
        label="Fichiers"
        name="files"
        description="Ajoutez des fichiers liés à l’événement (e.g. Votre CV, un capture d'écran). Vous pouvez télécharger plusieurs fichiers à la fois."
      >
        <UFileUpload
          label="Insérez vos fichier"
          description="Accepté : .pdf, .jpg, .png ..."
          layout="list"
          multiple
        >
          <template #file-trailing="{ }">
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
      </UFormField>

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
</template>
