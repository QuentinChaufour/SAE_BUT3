<script setup lang="ts">
import UserRole from '~~/shared/types/role'
import { z } from 'zod/v4'
import type { FileUploadItem } from '@nuxt/ui'
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
import FileDetails from '~/components/dossier/FileDetails.vue'
import { useDossierStore } from '~/stores/dossierStore'
import { useConnectedStudentStore } from '~/stores/connectedStudent'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
})

const dossierStore = useDossierStore()
const studentStore = useConnectedStudentStore()

const descriptionSchema = z.object({
  description: z.string().trim()
})

const titleSchema = z.object({
  titre: z.string().trim().min(1, { message: 'Le titre ne peut pas être vide' })
})

const alternanceSchema = z.object({
  alternance: z.boolean()
})

// Define the schema for the form
const schema = z.object({
  description: descriptionSchema.shape.description,
  titre: titleSchema.shape.titre,
  alternance: alternanceSchema.shape.alternance
})

const hasDescriptionChangedAndIsValid = computed(() => descriptionSchema.safeParse({ description: state.description }).success && state.description !== dossierStore.dossier?.description)
const hasTitleChangedAndIsValid = computed(() => titleSchema.safeParse({ titre: state.titre }).success && state.titre !== dossierStore.dossier?.titre)
const hasAlternanceChangedAndIsValid = computed(() => alternanceSchema.safeParse({ alternance: state.alternance }).success && state.alternance !== dossierStore.dossier?.alternance)
const getEventFiles = computed(() => {
  const files = <EventFile[]>[]

  dossierStore.events.forEach(event => {
    if (event.files) {
      files.push(...event.files)
    }
  })
  return files
})

const departementId = ref<number | null>(null)
const openedEventCreation = ref<boolean>(false)
const idDossier = Number(useRoute().params.idDossier)
const isreadOnly = computed(() => studentStore.isreadOnlyYear)
const toast = useToast()
const state = reactive({
  description: dossierStore.dossier?.description || '',
  titre: dossierStore.dossier?.titre || '',
  alternance: dossierStore.dossier?.alternance || false
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
    const response = await $fetch<APIResponse<Departement>>(`/api/students/${session.user.value?.numId}/departement`, {
      method: 'GET'
    })

    if (!response || response.statusCode !== 200) {
      throw new Error('Failed to get departement id')
    }

    return response.data?.idDepartement ?? null
  } catch (e) {
    console.error(e)
    return null
  }
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

async function createEvent(event: EventInfo, files: File[]) {
  try {
    const createdEvent = await dossierStore.createEvent(event)
    await dossierStore.uploadFiles(files, createdEvent.idDemarche, idDossier)

    openedEventCreation.value = false
  } catch (error) {
    console.error('Error creating event', error)
    toast.add({ title: 'Erreur', description: 'Erreur lors de la création de l\'événement', color: 'error' })
  }
}

async function updateEvent(event: EventInfo, files: File[]) {
  try {
    await dossierStore.updateEvent(event)
    await dossierStore.uploadFiles(files, event.idDemarche, idDossier)
  } catch {
    toast.add({ title: 'Erreur', description: 'Erreur lors de la mise à jour de l\'événement', color: 'error' })
  }
}

async function deleteEvent(event: EventInfo) {
  try {
    await dossierStore.deleteEvent(event)
    toast.add({ title: 'Succès', description: 'Événement supprimé avec succès', color: 'success' })
    openedEventCreation.value = false
  } catch {
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

  if (
    !hasDescriptionChangedAndIsValid.value
    && !hasTitleChangedAndIsValid.value
    && !hasAlternanceChangedAndIsValid.value
  ) {
    state.description = dossier.description || ''
    state.titre = dossier.titre
    state.alternance = dossier.alternance
    return
  }

  try {
    await dossierStore.updateDossier({
      description: state.description,
      titre: state.titre,
      alternance: state.alternance
    })

    toast.add({ title: 'Succès', description: 'Dossier mis à jour avec succès', color: 'success' })
  } catch (error) {
    console.error('Error updating dossier:', error)
  }
}

async function downloadFile(file: EventFile) {
  try {
    const eventId = dossierStore.events.find(event => event.files?.some(f => f.id === file.id))?.idDemarche

    if (!eventId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found for the given file to allow download'
      })
    }

    const blob = await dossierStore.downloadFile(file, eventId, dossierStore.getDossierId!)
    
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

onMounted(async () => {
  try {
    await dossierStore.initState(idDossier)
    await studentStore.fetchPromotions()

    if (dossierStore.dossier) {
      state.titre = dossierStore.dossier.titre
      state.description = dossierStore.dossier.description || ''
      state.alternance = dossierStore.dossier.alternance
    }

    departementId.value = await getDepartementId()
  } catch (error) {
    showError({
      statusCode: 500,
      message: 'Failed to load dossier data with id ' + idDossier,
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
        <div class="flex flex-col gap-1 justify-center items-center">
          <h1 class="text-2xl font-semibold text-highlighted">
            Mission : {{ dossierStore.dossier.titre }}
          </h1>
          <p class="text-sm text-muted">
            {{ dossierStore.dossier.description || '' }}
          </p>
        </div>
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
                :readOnly="isreadOnly"
                @updated="updateEvent"
                @deleted="deleteEvent"
              >
                <template #header_action v-if="!isreadOnly">
                  <UButton @click="openedEventCreation = true">
                    Ajouter un événement
                  </UButton>
                </template>
              </EventsManagement>
            </div>

            <div class="min-w-0 flex-2 space-y-5 lg:ml-6">
              <h1 class="text-xl font-semibold text-highlighted">
                Entreprise
              </h1>
              <div class="grid gap-4 rounded-lg bg-default p-4 sm:grid-cols-2">
                <div class="flex gap-1">
                  <p class="min-w-0 font-medium">
                    {{ dossierStore.dossier.Entreprise.nom || 'Aucune entreprise associée' }}
                  </p>
                  <p class="min-w-0 font-medium" v-if="dossierStore.dossier.Entreprise.nomEtab">
                    {{ ' : ' + dossierStore.dossier.Entreprise.nomEtab || '' }}
                  </p>
                </div>

                <p class="min-w-0 text-sm text-muted">
                  {{
                    [
                      dossierStore.dossier.Entreprise.adresse || 'Aucune adresse associée',
                      dossierStore.dossier.Entreprise.codePostal || 'Aucun code postal associé',
                      dossierStore.dossier.Entreprise.ville || 'Aucune ville associée'
                    ].join(' ')
                  }}
                </p>

                <UFormField
                  label="Type de recherche"
                  name="typeRecherche"
                  class="sm:col-span-2"
                >
                  <UCheckbox
                    v-model="state.alternance"
                    description="Alternance"
                    :disabled="isreadOnly"
                    @update:model-value="updateDossier"
                  />
                </UFormField>
              </div>

              <UForm
                :schema="schema"
                :state="state"
                class=" mt-6 mb-5 min-w-0 space-y-4"
              >
                <UFormField
                  label="Mission"
                  name="titre"
                  required
                >
                  <UInput
                    v-model="state.titre"
                    type="text"
                    :disabled="isreadOnly"
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
                    :disabled="isreadOnly"
                    placeholder="Envoi de la candidature, relance, entretien, etc..."
                    class="w-full"
                    @blur="updateDossier"
                  />
                </UFormField>
              </UForm>

              <UFormField
                label="Étiquettes de la recherche"
                name="tags"
                description="Étiquettes décrivant la recherche. Ajoutez ou supprimer en pour caratériser votre recherche."
                class="sm:col-span-2 w-full"
              >
                <template #label>
                  <div class="flex items-center gap-2">
                    <p>Domaines de la recherche</p>
                    <UTooltip
                      text="Pour créer un domaine, demandez au secrétariat de votre département."
                    >
                      <UIcon name="i-lucide-info" />
                    </UTooltip>
                  </div>
                </template>

                <DossierTagSelection
                  v-model:tags="dossierStore.dossierTags"
                  :id-departement="departementId"
                  :id-dossier="idDossier"
                  :readOnly="isreadOnly"
                  class="w-full"
                />
              </UFormField>

              <USeparator
                label="Contacts de la recherche"
                size="sm"
              />

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
                    :dossier-id="dossierStore.getDossierId!"
                    :contact="item"
                    :readOnly="isreadOnly"
                    @deleted="contactDeleted(Number(item.value))"
                    @updated="contactUpdated"
                  />
                </template>
              </UAccordion>
              <div
                v-else
                class="emptyDataPlaceholder"
              >
                <p class="text-sm text-gray-500">
                  Aucun contact au cours de la recherche.
                </p>
              </div>

              <USeparator
                label="Pieces jointes de la recherche"
                size="sm"
              />

              <FileDetails
                v-if="getEventFiles.length > 0"
                :files="getEventFiles"
                :read-only="true"
                :dossier-id="idDossier"
                @download="downloadFile"
              />

              <div
                v-else
                class="emptyDataPlaceholder"
              >
                <p class="text-sm text-gray-500">
                  Aucun fichier téléversé au cours de la recherche.
                </p>
              </div>
            </div>
          </div>
        </UPage>

        <USlideover
          v-model:open="openedEventCreation"
          :title="'Ajouter un événement'"
          class="slidingModal"
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
      </div>
    </template>
  </UDashboardPanel>
</template>
