<script setup lang="ts">
// import { user } from '#build/ui';
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const fields = ref<AuthFormField[]>([
  {
    name: 'login',
    type: 'text',
    label: 'Login',
    placeholder: 'Votre login',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Votre mot de passe',
    required: true
  }
])

// __________// Zod checks //__________//

// Define the schema
const schema = z.object({
  login: z.string().min(1, "Champs Obligatoire"),
  password: z.string().min(8, 'Minimum 8 caractères')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { login, password } = payload.data
  const response : any = await $fetch(`api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      login: login,
      password: password
    })
  })

  // TODO Toaster or something to show the error
  console.log(response)
  if (response.success) {
    console.log('Connexion réussie')

// TODO redirect the user to a main page based on his role 
//    await navigateTo("");

  } else if (!response.success) {
    console.log('Identifiants incorrects')
  }
}

</script>

<template>
  <div class="grid grid-cols-1 h-full">
    <UAuthForm
      title="Login"
      description="Enter your credentials to access your account."
      icon="i-lucide-user"
      :fields="fields"
      :schema="schema"
      :submit="{
        label: 'Submit',
        color: 'error',
        variant: 'subtle'
      }"
      class="max-w-md"
      @submit="onSubmit"
    />
  </div>
</template>
