<template>
    <NuxtLink :to="`/items/${item.documentId}`" class="group block bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <!-- Image Container -->
        <div class="relative w-full aspect-square overflow-hidden">
            <img :src="imageUrl" :alt="item.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div class="absolute top-2 left-2 bg-white/90 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">
                {{ item.itemCondition || 'N/A' }}
            </div>
        </div>

        <!-- Content Container -->
        <div class="p-4">
            <h3 class="font-bold text-gray-800 truncate text-lg">{{ item.name }}</h3>
            <p class="text-2xl font-extrabold text-blue-600 my-2">{{ formattedPrice(item.listingPrice) }}</p>

            <div class="border-t pt-3 mt-3 flex items-center justify-between">
                <div class="flex items-center">
                    <img :src="item.user?.profilePicture?.url || '/avatar-placeholder.png'" class="h-8 w-8 rounded-full object-cover">
                    <p class="text-xs text-gray-500 ml-2">@{{ item.user?.username || 'unknown' }}</p>
                </div>
                <div class="flex items-center text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                    {{ item.likedBy?.length || 0 }}
                </div>
            </div>
        </div>
    </NuxtLink>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const imageUrl = computed(() => {
    return props.item.userImages?.[0]?.url || '/image-placeholder.png';
});

const formattedPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0);
};
</script>