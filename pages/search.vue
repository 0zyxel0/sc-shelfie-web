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
            <div v-else-if="error" class="text-center text-red-500">An error occurred during search.</div>
            <div v-else-if="!items || items.length === 0" class="text-center bg-white p-8 rounded-lg">
                <h3 class="text-xl font-semibold">No results found</h3>
                <p class="text-gray-500 mt-2">Try searching for something else.</p>
            </div>

            <!-- Results Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <!-- The ItemCard component works without changes because our transformEntry in Strapi prepared the data! -->
                <ItemCard v-for="item in items" :key="item.id" :item="item" />
            </div>
        </main>
    </div>
</template>

<script setup>
const route = useRoute();
const client = useMeilisearch(); // Use our new composable
const config = useRuntimeConfig();

const searchQuery = computed(() => route.query.q || '');

// --- Fetch search results from MEILISEARCH ---
const { data: items, pending, error } = await useAsyncData(
    'meilisearch-results',
    async () => {
        if (!searchQuery.value) return [];

        const searchResults = await client.index('items').search(searchQuery.value, {
            limit: 25, // Limit results
        });

        return searchResults.hits;
    },
    {
        // The result from Meilisearch (`hits`) is already a clean array of flat objects.
        // No transform is needed here.
        watch: [searchQuery] // Re-run the fetch whenever the search query changes
    }
);

useHead({ title: () => `Search: ${searchQuery.value}` });
</script>