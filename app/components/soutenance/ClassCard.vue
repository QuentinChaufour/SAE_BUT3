<script setup lang="ts">
    const props = defineProps<{
        class_name: string,
        alternance: boolean,
        nb_etudiants: number,
        nb_stages: number,
    }>();
    const progress = ref(+props.nb_stages / +props.nb_etudiants);
</script>

<template>
    <UCard class="mx-2 my-1 flex-1 text-mist-950 dark:text-red-50" variant="subtle" :ui="{body: 'sm:p-2'}">
        <p class="text-lg text-gray-400 dark:text-gray-300 mb-1">{{ class_name }}{{ alternance ? ' alternance' : '' }}</p>
        <p>{{ nb_etudiants }} étudiants</p>
        <p>{{ nb_stages }} {{ alternance ? 'alternances' : 'stages' }}</p>
        <UProgress v-model="progress" :max="1" class="h-0.5 my-1"/>
    </UCard>
</template>