<script setup lang="ts">
import UserRole from '~~/shared/types/role'
import { z } from 'zod/v4'
import type { FormSubmitEvent, FileUploadItem } from '@nuxt/ui'
import type {
  DemarcheContact,
  Departement
} from '~~/generated/prisma/client'
import type { APIResponse } from '~~/shared/types/apiResponse'
import EventsManagement from '~/components/dossier/EventsManagement.vue'
import EventDescription from '~/components/dossier/EventDescription.vue'
import ContactForm from '~/components/forms/ContactForm.vue'
import DossierTagSelection from '~/components/dossier/DossierTagSelection.vue'
import StatusBadge from '~/components/dossier/StatusBadge.vue'
import { useDossierStore } from '~/stores/dossierStore'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
})

const dossierStore = useDossierStore()

const schema = z.object({
  description: z.string()
})

const hasDescriptionChanged = computed(() => schema.safeParse({ description: state.description }).success && state.description !== dossierStore.dossier?.description)

type Schema = z.output<typeof schema>
const files = ref<FileUploadItem[]>([])
const departementId = ref<number | null>(null)
const openedEventCreation = ref<boolean>(false) 
const idDossier = Number(useRoute().params.idDossier) ?? null
const toast = useToast()
const state = reactive({
  description: ''
})

async function getDepartementId(): Promise<number | null> {
  const session = useUserSession()

  try {
    const response = await $fetch<APIResponse<Departement>>(`/api/student/${session.user.value?.numId}/departement`, {
      method: 'GET'
    })

    if(!response || response.statusCode !== 200) {
      throw new Error('Failed to get departement id')
    }

    return response.data?.idDepartement ?? null
  }
  catch (e) {
    console.error(e)
    return null
  }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault()

  const dossier = dossierStore.dossier

  if (!dossier) {
    console.error('Dossier is not loaded')
    return
  }

  const newDescription = state.description

  if (newDescription === dossier.description) {
    return
  }

  try {
    const response = await $fetch<APIResponse<null>>(`/api/dossier/${dossier.idRecherche}`, {
      method: 'PATCH',
      body: { description: newDescription }
    })

    if (response.statusCode !== 200) {
      throw new Error('Failed to update description')
    }

    dossier.description = newDescription
  } catch (error) {
    // TODO handle error properly
    console.error('Error updating description:', error)
  }
}

function deleteFile(index: number) {
  // TODO
  console.log('File deleted:', index)
}

// keep the contact list up to date when a contact is added or updated
// without reloading the page & without making another API call
function contactUpdated(contact: DemarcheContact) {

  dossierStore.updateContacts({
    ...contact,
    label: `${contact.nom} ${contact.prenom}`.trim() || 'Pas de nom',
    value: String(contact.idContact),
    content: ''
  })
}

function contactDeleted(contact: DemarcheContact) {
  dossierStore.deleteContact(contact)
}

async function createEvent(event: EventInfo) {
  try{
    await dossierStore.createEvent(event)
    openedEventCreation.value = false 
  }
  catch{
    toast.add({ title: 'Erreur', description: 'Erreur lors de la création de l\'événement', color: 'error' })
  }
}

async function updateEvent(event: EventInfo){
  try{
    await dossierStore.updateEvent(event)
  }
  catch{
    toast.add({ title: 'Erreur', description: 'Erreur lors de la mise à jour de l\'événement', color: 'error' })
  }
}

async function deleteEvent(event: EventInfo){
  try{
    await dossierStore.deleteEvent(event)
    toast.add({ title: 'Succès', description: 'Événement supprimé avec succès', color: 'success' })
    openedEventCreation.value = false
  }
  catch{
    toast.add({ title: 'Erreur', description: 'Erreur lors de la suppression de l\'événement', color: 'error' })
  }
}

onMounted(async () => {
  try {
    await dossierStore.initState(idDossier)

    departementId.value = await getDepartementId()
  } catch (error) {
    showError({
      statusCode: 500,
      statusMessage: 'Failed to load dossier data with id ' + idDossier,
      data: error
    })
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="'Recherche de stages'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Dossier loading -->
      <div v-if="!dossierStore.dossier">
        <div class="flex flex-col items-center justify-center min-h-screen min-w-full">
          <UButton to="student/search">
            Retour
          </UButton>
          <p class="text-lg font-semibold mt-4">
            Chargement du dossier...
          </p>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col w-full p-5 gap-4"
      >
        <div class="flex justify-between">
          <UButton
            to="student/search"
          >
            Retour
          </UButton>

          <StatusBadge
            :status="dossierStore.getStatus"
            class="ml-4"
            :size="'xl'"
          />
        </div>

        <UPage>
          <div class="flex min-w-0 w-full flex-col gap-8 md:flex-row">
            <div class="min-w-0 flex-1">
              <EventsManagement 
                :events="dossierStore.events" 
                :dossier-id="idDossier"
                @updated="updateEvent"
                @deleted="deleteEvent"
              >
                <template #header_action>
                  <UButton @click="openedEventCreation = true">
                    Ajouter un événement
                  </UButton>
                </template>
              </EventsManagement>
            </div>

            <div class="min-w-0 flex-2 mr-10 ml-10 space-y-5">
              <div class="flex flex-wrap justify-between gap-4">
                <UFormField
                  label="Entreprise"
                  name="entreprise"
                >
                  <UInput
                    disabled
                    class="w-full sm:w-auto"
                    :model-value="dossierStore.dossier.Entreprise.nom || ''"
                  />
                </UFormField>

                <UFormField
                  label="Adresse"
                  name="adresse"
                >
                  <UInput
                    disabled
                    class="w-full sm:w-auto"
                    :model-value="dossierStore.dossier.Entreprise.adresse || ''"
                  />
                </UFormField>
              </div>

              <UForm
                :schema="schema"
                :state="state"
                class=" mt-6 mb-5 min-w-0 space-y-4"
                @submit="onSubmit"
              >
                <UFormField
                  label="Description"
                  name="description"
                >
                  <UTextarea
                    v-model="state.description"
                    class="w-full"
                  />
                </UFormField>

                <UButton
                  type="submit"
                  :disabled="!hasDescriptionChanged"
                >
                  Modifier
                </UButton>
              </UForm>

              <DossierTagSelection
                v-model:tags="dossierStore.dossierTags"
                :id-departement="departementId"
                :id-dossier="idDossier"
              />

              <USeparator />

              <UAccordion :items="dossierStore.contacts">
                <template #content="{ item }">
                  <ContactForm
                    update
                    :contact="item"
                    @deleted="contactDeleted(item)"
                    @updated="contactUpdated"
                  />
                </template>
              </UAccordion>

              <div>
                <!-- TODO replace with separator component -->
                <h2>Documents</h2>
                <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Pièces jointes
                </p>
              </div>

              <UFileUpload
                :model-value="files"
                :ui="{ base: 'hidden' }"
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
                    @click.stop="deleteFile(index)"
                  />
                </template>
              </UFileUpload>
            </div>
          </div>
        </UPage>
      </div>
    </template>
  </UDashboardPanel>

  <USlideover
    :title="'Ajouter un événement'"
    class="slidingModal"
    v-model:open="openedEventCreation"
  >
    <template #body>
      <EventDescription
        creation
        :dossier-id="idDossier"
        :state="{
          status: dossierStore.getStatus
        }"
        @created="createEvent"
      />
    </template>
  </USlideover>
</template>
