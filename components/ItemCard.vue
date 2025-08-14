<template>
    <NuxtLink :to="'/items/' + (item.documentId || item.id)" class="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div class="aspect-w-3 aspect-h-4 relative">
            <img v-if="imageUrl" :src="imageUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Item image">
            <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
            <span v-if="item.isPrivate" class="absolute top-2 right-2 bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded-full opacity-70" title="This item is private">Private</span>
        </div>
        <div class="p-4">
            <h3 class="font-semibold text-gray-800 truncate">{{ item.name }}</h3>
            <p class="text-sm text-gray-500 capitalize">{{ item.itemStatus }}</p>
        </div>
    </NuxtLink>
</template>

<script setup>
const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const config = useRuntimeConfig();

const imageUrl = computed(() => {
    // Check for the standard Strapi v4/v5 populated media structure
    if (props.item.userImages && props.item.userImages.length > 0) {
        return `${config.public.strapi.url}${props.item.userImages[0].url}`;
    }
    return null; // Fallback if no image exists
});
</script>