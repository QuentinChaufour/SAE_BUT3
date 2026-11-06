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
import ContactCard from '~/components/common/ContactCard.vue'
import { useDossierStore } from '~/stores/dossierStore'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
})
// TODO read-only on all components

const dossierStore = useDossierStore()

const descriptionSchema = z.object({
  description: z.string().trim(),
})

const titleSchema = z.object({
  titre: z.string().trim().min(1, { message: 'Le titre ne peut pas être vide' })
})

// Define the schema for the form
const schema = z.object({
  description: descriptionSchema.shape.description,
  titre: titleSchema.shape.titre
})

const hasDescriptionChanged = computed(() => descriptionSchema.safeParse({ description: state.description }).success && state.description !== dossierStore.dossier?.description)
const hasTitleChanged = computed(() => titleSchema.safeParse({ titre: state.titre }).success && state.titre !== dossierStore.dossier?.titre)

const files = ref<FileUploadItem[]>([])
const departementId = ref<number | null>(null)
const openedEventCreation = ref<boolean>(false) 
const idDossier = Number(useRoute().params.idDossier) ?? null
const toast = useToast()
const state = reactive({
  description: dossierStore.dossier?.description || '',
  titre: dossierStore.dossier?.titre || '',
})

const contactItems = computed(() =>
  dossierStore.contacts.map(contact => ({
    ...contact,
    label: `${contact.prenom} ${contact.nom}`.trim() || 'Contact sans nom',
    value: String(contact.idContact),
    content: ''
  }))
)

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

function deleteFile(index: number) {
  // TODO
  console.log('File deleted:', index)
}

// keep the contact list up to date when a contact is added or updated
// without reloading the page & without making another API call
function contactUpdated(contact: DemarcheContact) {

  dossierStore.updateContacts({
    ...contact,
    label: `${contact.prenom} ${contact.nom}`.trim() || 'Pas de nom',
    value: String(contact.idContact),
    content: ''
  })
}

function contactDeleted(idContact: number) {
  dossierStore.deleteContact(idContact)
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

async function updateDossier() {
  const dossier = dossierStore.dossier

  if (!dossier) {
    console.error('Dossier is not loaded')
    toast.add({ title: 'Erreur', description: 'Dossier non chargé', color: 'error' })
    return
  }

  const newDescription = state.description
  const newTitle = state.titre

  if (!hasDescriptionChanged.value && !hasTitleChanged.value) {
    return
  }

  try {
    await dossierStore.updateDossier({
        description: newDescription,
        titre: newTitle
    })

    toast.add({ title: 'Succès', description: 'Dossier mis à jour avec succès', color: 'success' })
  }
  catch (error) {
    console.error('Error updating dossier:', error)
  }

}

onMounted(async () => {
  try {
    await dossierStore.initState(idDossier)

    if (dossierStore.dossier) {
      state.titre = dossierStore.dossier.titre
      state.description = dossierStore.dossier.description || ''
    }

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
          <UButton @click="navigateTo('/student/search')">
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
            @click="navigateTo('/student/search')"
          >
            Retour
          </UButton>

          <div class="flex items-center">
            <p class="text-sm">
              Status de la recherche : 
            </p>
            <StatusBadge
              :status="dossierStore.getStatus"
              class="ml-4"
              :size="'lg'"
            />
          </div>
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
              >
                <UFormField
                  label="Titre"
                  name="titre"
                  required
                >
                  <UInput
                    v-model="state.titre"
                    type="text"
                    placeholder="Dépôt de candidature"
                    class="w-full"
                    @blur="updateDossier"
                  />
                </UFormField>

                <UFormField
                  label="Description"
                  name="description"
                >
                  <UTextarea
                    v-model="state.description"
                    placeholder="envoie de la candidature, relance, entretien, etc..."
                    class="w-full"
                    @blur="updateDossier"
                  />
                </UFormField>
              </UForm>


              <UFormField
                label="Étiquettes de la recherche"
                name="tags"
                description="Étiquettes décrivant la recherche. Ajoutez ou supprimer en pour caratériser votre recherche."
              >
                <template #label>
                  <div class="flex items-center gap-2">
                    <p>Étiquettes de la recherche</p>
                    <UTooltip
                      text="Pour créer une éttiquette, demandez a votre secrétariat de département."
                    >
                      <UIcon name="i-lucide-info"/>
                    </UTooltip>
                  </div>
                </template>

                <DossierTagSelection
                  v-model:tags="dossierStore.dossierTags"
                  :id-departement="departementId"
                  :id-dossier="idDossier"
                />
              </UFormField>

              <USeparator label="Contacts de la Recherche" size="sm"/>

              <UAccordion 
                v-if="dossierStore.contacts.length > 0" 
                :items="contactItems" 
                class="w-full space-y-2"
                :ui="{
                  item: 'overflow-hidden rounded-lg border border-default bg-default last:border-b',
                  trigger: 'cursor-pointer rounded-lg px-4 py-3 hover:bg-elevated/50 data-[state=open]:rounded-b-none data-[state=open]:bg-elevated',
                  content: 'border-t border-default px-4',
                  body: 'pb-4'
                }"
              > 
                <template #default="{ item }">
                  <ContactCard :contact="item" />
                </template>

                <template #content="{ item }">
                  <ContactForm
                    update
                    :contact="item"
                    @deleted="contactDeleted(Number(item.value))"
                    @updated="contactUpdated"
                  />
                </template>
              </UAccordion>
              <div v-else class="emptyDataPlaceholder">
                <p class="text-sm text-gray-500">
                  Aucun contact au cours de la recherche.
                </p>
              </div>

              <USeparator label="Pieces jointes de la recherche" size="sm"/>

              <UFileUpload
                v-if="files.length > 0"
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

              <div v-else class="emptyDataPlaceholder">
                <p class="text-sm text-gray-500">
                  Aucun fichiers téléversé au cours de la recherche.
                </p>
              </div>
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
