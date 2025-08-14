<template>
    <div class="bg-gray-100 min-h-screen">
        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center items-center h-screen">
            <div class="text-xl text-gray-500">Loading item...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex justify-center items-center h-screen">
            <div class="text-center">
                <h2 class="text-2xl text-red-600 font-bold mb-2">Failed to load item</h2>
                <p class="text-gray-600">The item could not be found or an error occurred.</p>
                <NuxtLink to="/" class="mt-4 inline-block text-blue-500 hover:underline">Go to Homepage</NuxtLink>
            </div>
        </div>

        <!-- Content Display -->
        <div v-else-if="item" class="container mx-auto p-4 md:p-8">
            <div class="bg-white rounded-lg shadow-xl overflow-hidden">
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-0">

                    <!-- Column 1: Image Gallery -->
                    <div class="lg:col-span-3 p-6">
                        <div class="aspect-w-1 aspect-h-1 w-full">
                            <img :src="mainImageUrl" alt="Main item image" class="w-full h-full object-contain rounded-lg transition-all duration-300">
                        </div>
                        <!-- Thumbnails -->
                        <div v-if="item.userImages && item.userImages.length > 1" class="mt-4 grid grid-cols-5 gap-2">
                            <div v-for="(image, index) in item.userImages" :key="image.id" @click="activeImageIndex = index" class="cursor-pointer border-2 rounded-md transition-all" :class="index === activeImageIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-400'">
                                <img :src="getStrapiMedia(image.url)" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover rounded">
                            </div>
                        </div>
                    </div>

                    <!-- Column 2: Item Details -->
                    <div class="lg:col-span-2 p-6 bg-gray-50/50 border-l border-gray-200">
                        <!-- Header -->
                        <div class="flex justify-between items-start">
                            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">{{ item.name }}</h1>
                            <span class="ml-4 text-sm font-medium py-1 px-3 rounded-full capitalize" :class="statusBadgeClass">{{ item.status }}</span>
                        </div>

                        <!-- Owner Info -->
                        <div v-if="item.user" class="mt-2">
                            <p class="text-sm text-gray-500">
                                Cataloged by <NuxtLink :to="`/users/${item.user.username}`" class="font-medium text-blue-600 hover:underline">{{ item.user.username }}</NuxtLink>
                            </p>
                        </div>

                        <!-- Edit Button -->
                        <NuxtLink v-if="isOwner" :to="`/items/${item.id}/edit`" class="mt-4 inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
                            Edit This Item
                        </NuxtLink>

                        <!-- Metadata Section -->
                        <div class="mt-6">
                            <h3 class="font-semibold text-gray-700">Details</h3>
                            <dl class="mt-2 grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                                <div v-if="item.manufacturer" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Manufacturer</dt>
                                    <dd>{{ item.manufacturer.name }}</dd>
                                </div>
                                <div v-if="item.character" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Character</dt>
                                    <dd>{{ item.character.name }}</dd>
                                </div>
                                <div v-if="item.series" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Series</dt>
                                    <dd>{{ item.series.name }}</dd>
                                </div>
                                <div v-if="item.rating" class="flex justify-between items-center">
                                    <dt class="font-medium text-gray-800">My Rating</dt>
                                    <dd class="flex items-center">
                                        <span v-for="i in 5" :key="i" class="text-xl" :class="i <= item.rating ? 'text-yellow-400' : 'text-gray-300'">★</span>
                                    </dd>
                                </div>
                                <div v-if="item.purchasePrice" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Purchase Price</dt>
                                    <dd>$ {{ item.purchasePrice }}</dd>
                                </div>
                                <div v-if="item.purchaseDate" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Acquired Date</dt>
                                    <dd>{{ new Date(item.purchaseDate).toLocaleDateString() }}</dd>
                                </div>
                            </dl>
                        </div>

                        <!-- Categories -->
                        <div v-if="item.categories && item.categories.length > 0" class="mt-6">
                            <h3 class="font-semibold text-gray-700">Categories</h3>
                            <div class="mt-2 flex flex-wrap gap-2">
                                <span v-for="category in item.categories" :key="category.id" class="text-xs font-semibold bg-gray-200 text-gray-700 py-1 px-3 rounded-full">
                                    {{ category.name }}
                                </span>
                            </div>
                        </div>

                        <!-- User Description -->
                        <div v-if="item.description" class="mt-6">
                            <h3 class="font-semibold text-gray-700">My Notes</h3>
                            <!-- IMPORTANT: Only use v-html if you trust or have sanitized the content from Strapi -->
                            <div class="prose prose-sm mt-2 max-w-none text-gray-600" v-html="item.description"></div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import qs from 'qs';

const route = useRoute();
const loggedInUser = useStrapiUser();
const token = useStrapiToken();
const config = useRuntimeConfig();

// --- KEY CHANGE HERE ---
// Get the documentId from the route parameters.
const docId = route.params.documentId;

const headers = token.value ? { Authorization: `Bearer ${token.value}` } : {};

const queryParams = {
    populate: {
        user: { fields: ['username'] },
        userImages: { fields: ['url', 'name', 'alternativeText'] },
        manufacturer: { fields: ['name'] },
        series: { fields: ['name'] },
        character: { fields: ['name'] },
        categories: { fields: ['name'] }
    }
};

const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });

// --- KEY CHANGE HERE ---
// We now query the API using the documentId.
// Note: Strapi's API for finding a single entry uses the standard `id` in the URL path.
// If your `documentId` is different from the numeric ID, we need to query by it as a filter.
// We will try the most common approach first.
const fullUrl = `${config.public.strapi.url}/api/items/${docId}?${queryString}`;


const { data: item, pending, error } = await useAsyncData(
    `item-${docId}`, // Use docId in the key for uniqueness
    () => $fetch(fullUrl, { headers: headers }),
    {
        transform: (response) => response.data
    }
);

// --- The rest of the script remains exactly the same ---
const activeImageIndex = ref(0);

const getStrapiMedia = (url) => {
    if (!url) return null;
    return `${config.public.strapi.url}${url}`;
};

const mainImageUrl = computed(() => {
    if (item.value?.userImages?.length > 0) {
        const activeImage = item.value.userImages[activeImageIndex.value];
        return getStrapiMedia(activeImage.url);
    }
    return '/image-placeholder.png';
});

const isOwner = computed(() => {
    // We now compare against the numeric ID which should still be present in the response
    return loggedInUser.value && item.value && loggedInUser.value.id === item.value.user?.id;
});

const statusBadgeClass = computed(() => {
    if (!item.value) return 'bg-gray-200 text-gray-800';
    // You may need to update this field name if it's different in your `Item` content type
    const status = item.value.itemStatus || item.value.status;
    switch (status) {
        case 'Owned': return 'bg-green-100 text-green-800';
        case 'Wishlist': return 'bg-yellow-100 text-yellow-800';
        case 'Pre-ordered': return 'bg-blue-100 text-blue-800';
        case 'For Sale': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
});

useHead({
    title: () => item.value ? `${item.value.name} | Shelfie` : 'Item | Shelfie'
});
</script>

<style>
/* For the `prose` class from Tailwind Typography if you install it */
/* npm install -D @tailwindcss/typography */
/* Then add `require('@tailwindcss/typography')` to your tailwind.config.js plugins */
</style>