<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})

type LoginResponse = { success: true } | { error: false, message: string }

const fields = ref<AuthFormField[]>([
  {
    name: 'login',
    type: 'text',
    label: 'Nom d\'utilisateur',
    placeholder: 'oXXXXXXX / pXXXXXXX',
    required: true
  },
  {
    name: 'oldPassword',
    type: 'password',
    label: 'Ancien Mot de passe',
    placeholder: 'Votre ancien mot de passe',
    required: true
  },
  {
    name: 'newPassword',
    type: 'password',
    label: 'Nouveau Mot de passe',
    placeholder: 'Votre nouveau mot de passe',
    required: true
  }
])

// __________// Zod checks //__________//

// Define the schema
const schema = z.object({
  login: z.string().min(1, 'Champs Obligatoire'),
  oldPassword: z.string().min(8, 'Minimum 8 caractères'),
  newPassword: z.string().min(8, 'Minimum 8 caractères')
}).refine(
  obj => obj.oldPassword !== obj.newPassword,
  {
    path: ['newPassword'],
    message: 'Le nouveau et l'ancien mot de passe doivent être différent.'
  }
)

const toaster = useToast()
const loading = ref<boolean>(false)

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  let response: LoginResponse

  try {
    response = await $fetch<LoginResponse>(`/api/auth/password`, {
      method: 'POST',
      body: {
        login: payload.data.login,
        oldPassword: payload.data.oldPassword,
        newPassword: payload.data.newPassword
      }
    })

    if ('success' in response && response.success) {
      toaster.add({
        color: 'success',
        title: 'Connexion réussi !'
      })

      // redirect the user to the login page
      await navigateTo('/auth/login')
    }
  } catch {
    toaster.add({
      color: 'error',
      title: 'Connexion échoué !'
    })
  }
}
</script>

<template>
  <div class="flex min-h-screen justify-center items-center">
    <UAuthForm
      title="Changement de mot de passe"
      description="Veuillez indiquer vos identifiant ainsi que votre nouveau mot de passe."
      icon="i-lucide-user"
      :fields="fields"
      :schema="schema"
      :submit="{
        label: 'Modifier',
        variant: 'subtle'
      }"
      :loading="loading"
      class="w-full max-w-md p-5"
      @submit="onSubmit"
    />
  </div>
</template>
