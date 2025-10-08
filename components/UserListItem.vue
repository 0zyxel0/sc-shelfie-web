<!-- components/UserListItem.vue -->
<template>
    <NuxtLink :to="'/users/' + user.username" class="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
        <img :src="profilePictureUrl" :alt="user.displayName || user.username + ' profile picture'" class="h-12 w-12 rounded-full object-cover">
        <div>
            <p class="font-bold text-gray-800">{{ user.displayName || user.username }}</p>
            <p class="text-sm text-gray-500">@{{ user.username }}</p>
        </div>
    </NuxtLink>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const runtimeConfig = useRuntimeConfig(); // Access runtimeConfig inside setup

const profilePictureUrl = computed(() => {
    // Check if profilePicture exists and has a url property (flattened by BFF)
    if (props.user.profilePicture?.url) {
        return props.user.profilePicture.url;
    }
    return '/avatar-placeholder.png'; // Default placeholder
});
</script>