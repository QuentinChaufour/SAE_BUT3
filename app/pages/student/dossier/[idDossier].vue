<script setup lang="ts">
import UserRole from '~~/shared/types/role'
import type { ContactInfo } from '~~/shared/types/contact'
import { z } from 'zod/v4'
import type { FormSubmitEvent, AccordionItem, FileUploadItem } from '@nuxt/ui'
import type {
  DemarcheContact,
  DemarcheEvenement,
  DepartementTag,
  Entreprise,
  PieceJointe,
  RechercheStage,
  Departement
} from '~~/generated/prisma/client'
import type { EventInfo } from '~~/shared/types/event'
import type { APIResponse } from '~~/shared/types/apiResponse'
import type { contactSchema } from '~~/shared/schemas/contact'
import EventsManagement from '~/components/dossier/EventsManagement.vue'
import EventDescription from '~/components/dossier/EventDescription.vue'
import ContactForm from '~/components/forms/ContactForm.vue'
import DossierTagSelection from '~/components/dossier/DossierTagSelection.vue'

definePageMeta({
  middleware: ['auth', 'role'],
  role: UserRole.Student
})

type DossierFull = Pick<
  RechercheStage,
  'idRecherche' | 'titre' | 'description' | 'alternance'
  > & {
  Entreprise: Pick<
    Entreprise,
    'nom' | 'adresse' | 'codePostal' | 'ville'
  >

  DemarcheEvenement: Array<
    Pick<DemarcheEvenement, 'description'| 'titre' | 'status' | 'source' | 'idDemarche'> & {
      // Date values are serialized as strings by the API.
      date: string

      LienPj: Array<{
        PieceJointe: Pick<PieceJointe, 'nom' | 'idPieceJointe'>
      }>

      DemarcheRechercheContact: Array<{
        DemarcheContact: DemarcheContact
      }>
    }
  >

  DepartementTagRecherche: Array<{
    DepartementTag: DepartementTag
  }>
}

type ContactInfoAcccordion = AccordionItem & ContactInfo

// idContact is only needed when creating a new contact 
type contactSchemaType = z.output<typeof contactSchema> & {
  idContact: number
}

const schema = z.object({
  description: z.string()
})

const hasDescriptionChanged = computed(() => schema.safeParse({ description: state.description }).success && state.description !== dossier.value?.description)

type Schema = z.output<typeof schema>

const idDossier = Number(useRoute().params.idDossier) ?? null
const dossier = ref<DossierFull>()
const events = ref<EventInfo[]>([])
const dossierTags = ref<string[]>([])
const contacts = ref<ContactInfoAcccordion[]>([])
const files = ref<FileUploadItem[]>([])
const departementId = ref<number | null>(null)
const openedEventCreation = ref<boolean>(false)
const state = reactive({
  description: ''
})

async function initComponent() {
  try {
    const response = await $fetch<APIResponse<DossierFull>>(
      `/api/dossier/${idDossier}`,
      { method: 'GET' }
    )

    if (response.statusCode !== 200 || !response.data) {
      return
    }

    const loadedDossier = response.data
    dossier.value = loadedDossier

    // populate the dossierTags array with the tags from the dossier
    for (const tag of dossier.value.DepartementTagRecherche) {
      dossierTags.value.push(tag.DepartementTag.nomTag)
    }

    // populate the timeline items with the events from the dossier
    for (const event of dossier.value.DemarcheEvenement) {
      const date = new Date(Date.parse(event.date))
      events.value.push({
        date: date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(),
        title: event.titre || 'Pas de titre',
        idDemarche: event.idDemarche,
        titre: event.titre || 'Pas de titre',
        description: event.description || '',
        icon: 'i-lucide-rocket',
        status: event.status,
        source: event.source,
        contacts: event.DemarcheRechercheContact.map(c => c.DemarcheContact),
        files: event.LienPj.map(pj => { return { nom: pj.PieceJointe.nom, idPieceJointe: pj.PieceJointe.idPieceJointe }; })
      })
    }

    // TODO replace with computed
    for (const file of dossier.value.DemarcheEvenement.flatMap(e => e.LienPj.map(pj => pj.PieceJointe))) {
      // skip files with no name
      if (!file.nom) {
        continue
      }

      let fileType = ''

      // Only pdf and image files are supported for now,
      // so we can use a simple check to determine the file type
      if (file.nom.endsWith('.pdf')) {
        fileType = 'application/pdf'
      } else {
        fileType = 'image/*'
      }

      files.value.push({
        name: file.nom,
        type: fileType,
        avatar: {
          icon: fileType === 'application/pdf' ? 'i-lucide-file-text' : 'i-lucide-image'
        }
      })
    }

    // TODO computed ?
    for (const contact of dossier.value.DemarcheEvenement.flatMap(e => e.DemarcheRechercheContact.map(c => c.DemarcheContact))) {
      contacts.value.push({
        value: String(contact.idContact),
        label: `${contact.nom} ${contact.prenom}`,
        content: '',
        idContact: contact.idContact,
        nom: contact.nom || '',
        prenom: contact.prenom || '',
        fonction: contact.fonction || '',
        email: contact.email || '',
        telephone: contact.telephone || ''
      })
    }

    // update the state with the dossier description
    state.description = dossier.value.description || ''
  } catch (e) {
    console.error(e)
  }
}

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

  if (!dossier.value) {
    console.error('Dossier is not loaded')
    return
  }

  const newDescription = state.description

  if (newDescription === dossier.value.description) {
    return
  }

  try {
    const response = await $fetch(`/api/dossier/${idDossier}`, {
      method: 'PATCH',
      body: { description: newDescription }
    })

    if (!response || (response as any).statusCode !== 200) {
      throw new Error('Failed to update description')
    }

    dossier.value.description = newDescription
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
function contactSubmitted(contact: contactSchemaType , index?: number) {

 if (index !== undefined) {
    const existing = contacts.value[index]
    if (!existing) {
      throw new Error(`No contact found at index ${index}`)
    }

    Object.assign(existing, {
      label: `${contact.nom} ${contact.prenom}`,
      nom: contact.nom || '',
      prenom: contact.prenom || '',
      fonction: contact.fonction || '',
      email: contact.email || '',
      telephone: contact.telephone || ''
    })
  }
  else {
    contacts.value.push({
      value: String(contact.idContact),
      label: contact.nom + ' ' + contact.prenom,
      content: '',
      idContact: contact.idContact,
      fonction: contact.fonction || '',
      email: contact.email || '',
      telephone: contact.telephone || '',
      nom: contact.nom || '',
      prenom: contact.prenom || ''
    })
  }
}

function eventCreated(event: EventInfo) {
  events.value.push({
    date: new Date(event.date).toLocaleDateString(),
    idDemarche: event.idDemarche,
    title: event.titre || 'Pas de titre',
    titre: event.titre || 'Pas de titre',
    description: event.description || '',
    icon: 'i-lucide-rocket',
    status: event.status,
    source: event.source,
    contacts: event.contacts,
    files: event.files
  })

  // sort the events by date, newest first
  events.value.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  openedEventCreation.value = false
}

function deleteEvent(event: EventInfo) {
  const index = events.value.findIndex(e => e.idDemarche === event.idDemarche)

  if (index !== -1) {
    events.value.splice(index, 1)
  }
}

onMounted(async () => {
  await initComponent()

  departementId.value = await getDepartementId()
})
// TODO bug contacts doubles
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
      <div v-if="!dossier">
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
        <div class="mb-5">
          <UButton
            to="student/search"
          >
            Retour
          </UButton>

          <!-- TODO dossier status -->
        </div>

        <UPage>
          <div class="flex min-w-0 w-full flex-col gap-8 md:flex-row">
            <!-- TODO class as prop -->
            <div class="min-w-0 flex-1">
              <EventsManagement 
                :events="events" 
                :dossier-id="dossier.idRecherche"
                @deleted-event="deleteEvent"
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
                    :model-value="dossier.Entreprise.nom || ''"
                  />
                </UFormField>

                <UFormField
                  label="Adresse"
                  name="adresse"
                >
                  <UInput
                    disabled
                    class="w-full sm:w-auto"
                    :model-value="dossier.Entreprise.adresse || ''"
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
                v-model:tags="dossierTags"
                :id-departement="departementId"
                :id-dossier="dossier.idRecherche"
              />

              <USeparator />

              <UAccordion :items="contacts">
                <template #content="{ item, index }">
                  <ContactForm
                    update
                    :contact="item"
                    @submitted="contactSubmitted($event, index)"
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
    :size="'xl'"
    v-model:open="openedEventCreation"
  >
    <template #body>
      <EventDescription
        creation
        :dossier-id="idDossier"
        @created="eventCreated"
      />
    </template>
  </USlideover>
</template>
