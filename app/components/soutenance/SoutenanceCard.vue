<script setup lang="ts">
    const props = defineProps<{
        class_name: string,
        type: string,
        stages: number,
        soutenances: number
    }>();
    let progress: number = +props.soutenances / +props.stages;
</script>

<template>
    <UCard class="mx-2 my-1 flex-1 text-mist-950 dark:text-red-50" variant="subtle" :ui="{body: 'sm:p-2'}">
        <p class="text-lg text-gray-400 dark:text-gray-300 mb-1">{{ class_name }}</p>
        <p v-if="type === 'stage'">{{ stages }} stagiaires</p>
        <p v-else>{{ stages }} alternants</p>
        <p>{{ soutenances }} soutenances planifiées</p>
        <UProgress v-model="progress" :max="1" class="h-0.5 my-1"/>
    </UCard>
</template>