<script setup lang="ts">
// import { user } from '#build/ui';
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

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
    name: 'password',
    type: 'password',
    label: 'Mot de passe',
    placeholder: 'Votre mot de passe',
    required: true
  }
])

// __________// Zod checks //__________//

// Define the schema
const schema = z.object({
  login: z.string().min(1, 'Champs Obligatoire'),
  password: z.string().min(8, 'Minimum 8 caractères')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    const response = await $fetch<LoginResponse>(`api/auth/login`, {
      method: 'POST',
      body: { login: payload.data.login, password: payload.data.password }
    })

    if ('success' in response && response.success) {
      console.log('Connexion réussie')
      // TODO redirect the user to a main page based on his role
      //    await navigateTo("");
    }
  } catch (error) {
    console.error('Error during login:', error)
  }
}
</script>

<template>
  <div class="grid grid-cols-1 h-full">
    <UAuthForm
      title="Connexion"
      description="Veuillez vous connecter pour accéder à votre compte."
      icon="i-lucide-user"
      :fields="fields"
      :schema="schema"
      :submit="{
        label: 'Connexion',
        variant: 'subtle'
      }"
      class="max-w-md"
      @submit="onSubmit"
    />
  </div>
</template>
