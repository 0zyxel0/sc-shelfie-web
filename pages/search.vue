<template>
    <div>
        <main class="container mx-auto py-8 px-4">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">Search Results</h1>
                <p v-if="searchQuery" class="mt-1 text-lg text-gray-600">
                    Showing results for: <span class="font-semibold text-blue-600">"{{ searchQuery }}"</span>
                </p>
            </div>

            <!-- Loading/Error/Empty States -->
            <div v-if="pending" class="text-center text-gray-500">Searching...</div>
            <div v-else-if="error" class="text-center text-red-500">Failed to fetch search results.</div>
            <div v-else-if="!items || items.length === 0" class="text-center bg-white p-8 rounded-lg">
                <h3 class="text-xl font-semibold">No results found</h3>
                <p class="text-gray-500 mt-2">Try searching for something else.</p>
            </div>

            <!-- Results Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <ItemCard v-for="item in items" :key="item.id" :item="item" />
            </div>
        </main>
    </div>
</template>

<script setup>
import qs from 'qs';
const route = useRoute();
const config = useRuntimeConfig();

// Reactive search query from the URL
const searchQuery = computed(() => route.query.q || '');

// --- Fetch search results from the API ---
const { data: items, pending, error, refresh } = await useAsyncData(
    'search-results',
    async () => {
        const query = qs.stringify({
            // Strapi's deep filtering to search across multiple fields
            filters: {
                $or: [
                    { name: { $containsi: searchQuery.value } },
                    { character: { name: { $containsi: searchQuery.value } } },
                    { series: { name: { $containsi: searchQuery.value } } },
                    { manufacturer: { name: { $containsi: searchQuery.value } } },
                ],
                isPrivate: { $eq: false } // Only search public items
            },
            populate: { userImages: { fields: ['url'] }, user: { fields: ['username'] } },
        });
        return await $fetch(`${config.public.strapi.url}/api/items?${query}`);
    },
    {
        transform: (response) => response.data.map(item => ({ id: item.id, ...item })),
        watch: [searchQuery] // Re-run the fetch whenever the search query changes
    }
);

useHead({ title: () => `Search: ${searchQuery.value}` });
</script>