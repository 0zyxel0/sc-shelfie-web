<template>
    <div class="bg-gray-100 min-h-screen">
        <main class="container mx-auto py-8 px-4 max-w-4xl">
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-gray-800">Upcoming Pre-orders</h1>
                <p class="mt-2 text-lg text-gray-600">A chronological list of your upcoming releases.</p>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="text-center text-gray-500 py-20">
                <p>Loading your pre-orders...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center bg-white p-12 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold text-red-700">Could not load your pre-orders</h3>
                <p class="text-gray-500 mt-2">{{ error.data?.statusMessage || "Please try again later." }}</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!upcomingItems || upcomingItems.length === 0" class="text-center bg-white p-12 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold text-gray-800">No Upcoming Pre-orders</h3>
                <p class="text-gray-500 mt-2">Items you mark as "Pre-ordered" with a future release date will appear here.</p>
                <NuxtLink to="/my-shelf" class="mt-6 inline-block text-blue-600 font-semibold hover:underline">
                    View My Shelf
                </NuxtLink>
            </div>

            <!-- Upcoming Items List -->
            <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
                <ul class="divide-y divide-gray-200">
                    <li v-for="item in upcomingItems" :key="item.id">
                        <NuxtLink :to="`/items/${item.id}`" class="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">

                            <!-- Image Source: URL is expected to be correctly prefixed by transform -->
                            <img v-if="item.userImages && item.userImages[0]?.url" :src="item.userImages[0].url" class="h-24 w-24 rounded-lg object-cover flex-shrink-0 bg-gray-200 shadow">
                            <div v-else class="h-24 w-24 rounded-lg bg-gray-200 flex-shrink-0"></div>

                            <div class="flex-1">
                                <p class="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors">{{ item.name }}</p>
                                <p class="text-sm text-gray-600 mt-1">
                                    Releases on:
                                    <span class="font-semibold text-gray-800">
                                        {{ new Date(item.purchaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
                                    </span>
                                </p>
                                <div class="mt-2 text-sm text-gray-500">
                                    Status:
                                    <span class="font-semibold px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        {{ item.itemStatus }}
                                    </span>
                                </div>
                            </div>

                            <!-- Countdown Timer -->
                            <div class="text-right">
                                <p class="text-xl sm:text-2xl font-bold text-blue-600">{{ countdown(item.purchaseDate).days }}</p>
                                <p class="text-xs text-gray-500">days away</p>
                            </div>
                        </NuxtLink>
                    </li>
                </ul>
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed } from 'vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Upcoming Pre-orders | Shelfie' });

const currentUser = useStrapiUser();
const config = useRuntimeConfig();
const { find } = useStrapi();

// --- Data Fetch ---
const { data: itemsResponse, pending, error } = await useAsyncData(
    `pre-order-list-${currentUser.value?.id}`,
    async () => {
        const userId = currentUser.value?.id;
        if (!userId) {
            return Promise.resolve(null);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const query =
        {
            filters: {
                user: { id: { $eq: userId } },
                itemStatus: { $eq: "Pre-ordered" },
                purchaseDate: { $gte: todayISO },
            },
            // Note: Since we assume full flattening, we only need 'populate: true' or specific fields.
            populate: {
                userImages: { fields: ["url", "name"] },
            },
            sort: ['purchaseDate:asc'],
            pagination: { pageSize: 500 },
        };

        return await find('items', query);
    },
    {
        transform: (response) => {
            if (!response?.data) return [];

            // If the Nuxt Strapi plugin is fully flattening, response.data is an array of items.
            // We only need to ensure the media URLs are correctly prefixed.
            return response.data.map(item => {
                // Item is already flattened, e.g., item.name, item.purchaseDate
                const transformedItem = { id: item.id, ...item };

                // --- Media URL Prefixing ---
                if (transformedItem.userImages?.length) {
                    // Assuming userImages is an array of media objects { id, url, name, ... }
                    transformedItem.userImages = transformedItem.userImages.map(img => ({
                        id: img.id,
                        // If the URL is already absolute (e.g., CDN), use it; otherwise, prefix Strapi URL
                        url: img.url.startsWith('http') ? img.url : config.public.strapi.url + img.url
                    }));
                } else {
                    transformedItem.userImages = [];
                }

                return transformedItem;
            });
        },
        watch: [() => currentUser.value?.id],
        server: true
    }
);

const upcomingItems = computed(() => itemsResponse.value || []);


// --- Countdown Utility Function (Unchanged) ---
const countdown = (targetDate) => {
    if (!targetDate) return { days: 0 };
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    return {
        days: days > 0 ? days : 0,
    };
};
</script>