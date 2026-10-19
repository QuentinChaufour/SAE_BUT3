<script setup lang="ts">
// import { user } from '#build/ui';
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod';

const fields = ref<AuthFormField[]>([
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    placeholder: 'Votre email'
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Votre mot de passe'
  }
])

//__________// Zod checks //__________//

// Define the schema
const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});

type Schema = z.output<typeof schema>

var database = false;
// data to validate (a changer pour quil verifie tout les users de la BD)
const users = reactive({
  email: `${!database ? 'g@g.com' : ''}`,
  password: `${!database ? 'azertyui' : ''}`
});

function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { email, password } = payload.data

  if (email === users.email && password === users.password) {
    console.log('Connexion réussie')
  } else {
    console.log('Identifiants incorrects')
  }
}

function check() {
  console.log(users.email, " - ", users.password)
  const miel = schema.parse(users);
  const result = schema.safeParse(users);
  if (!result.success) {
    console.log(result.error);   // ZodError instance
  } else {
    console.log(result.data);    // { username: string; xp: number }
  }
};

</script>

<template>
  <div class="grid grid-cols-1 justify-center self-center h-full">

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
