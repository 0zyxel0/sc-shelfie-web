<template>
    <div class="bg-gray-50 min-h-screen">
        <div class="max-w-screen-xl mx-auto py-8 px-4">

            <!-- Header -->
            <header class="text-center mb-8">
                <h1 class="text-5xl font-extrabold text-gray-900 tracking-tight">Marketplace</h1>
                <p class="mt-2 text-lg text-gray-600">Discover and buy amazing items from fellow collectors.</p>
            </header>

            <!-- Filters & Sorting Bar -->
            <div class="bg-white p-4 rounded-lg border border-gray-200 mb-8 sticky top-4 z-10 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <!-- Search Input -->
                    <div class="md:col-span-2 lg:col-span-2">
                        <label for="search" class="block text-sm font-medium text-gray-700">Search by name</label>
                        <input type="text" v-model="searchQuery" id="search" placeholder="e.g., Captain America Statue" class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <!-- Condition Filter -->
                    <div>
                        <label for="condition" class="block text-sm font-medium text-gray-700">Condition</label>
                        <select id="condition" v-model="conditionFilter" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            <option value="">All Conditions</option>
                            <option>New</option>
                            <option>Like New</option>
                            <option>Used - Good</option>
                            <option>Used - Fair</option>
                        </select>
                    </div>
                    <!-- Sort By -->
                    <div>
                        <label for="sort" class="block text-sm font-medium text-gray-700">Sort by</label>
                        <select id="sort" v-model="sortOption" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            <option value="createdAt:desc">Newest First</option>
                            <option value="listingPrice:asc">Price: Low to High</option>
                            <option value="listingPrice:desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="text-center py-16">
                <p class="text-gray-500">Loading listings...</p>
                <!-- Optional: Add a spinner -->
            </div>

            <!-- No Results State -->
            <div v-else-if="!items || items.length === 0" class="text-center py-16 bg-white rounded-lg border">
                <h3 class="text-xl font-semibold text-gray-800">No Items Found</h3>
                <p class="text-gray-500 mt-2">Try adjusting your search filters or check back later!</p>
            </div>

            <!-- Items Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <MarketplaceItemCard v-for="item in items" :key="item.id" :item="item" />
            </div>

            <!-- Pagination Controls -->
            <div v-if="pagination.pageCount > 1" class="mt-12 flex justify-center items-center space-x-4">
                <button @click="goToPage(pagination.page - 1)" :disabled="pagination.page === 1" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                </button>
                <span class="text-sm text-gray-600">
                    Page {{ pagination.page }} of {{ pagination.pageCount }}
                </span>
                <button @click="goToPage(pagination.page + 1)" :disabled="pagination.page === pagination.pageCount" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                </button>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

useHead({ title: 'Marketplace | Shelfie' });

const { find } = useStrapi();
const router = useRouter();
const route = useRoute();

// --- Reactive State for Filters and Pagination ---
const searchQuery = ref(route.query.q || '');
const conditionFilter = ref(route.query.condition || '');
const sortOption = ref(route.query.sort || 'createdAt:desc');
const currentPage = ref(Number(route.query.page) || 1);
const itemsPerPage = 12;

// --- Computed property to build Strapi query object ---
const strapiQuery = computed(() => {
    const filters = {
        // This is the most important filter: only show items for sale
        isForSale: { $eq: true },
    };

    if (searchQuery.value) {
        filters.name = { $containsi: searchQuery.value };
    }

    if (conditionFilter.value) {
        filters.itemCondition = { $eq: conditionFilter.value };
    }

    return {
        filters,
        populate: ['userImages', 'user.profilePicture', 'likedBy'],
        sort: sortOption.value,
        pagination: {
            page: currentPage.value,
            pageSize: itemsPerPage,
        },
    };
});

// --- Data Fetching with useAsyncData ---
// `watch` will re-trigger the fetch whenever the query changes
const { data: response, pending, error } = await useAsyncData(
    'marketplace-items',
    () => find('items', strapiQuery.value),
    { watch: [strapiQuery] }
);

// Extract items and pagination from the response
const items = computed(() => response.value?.data || []);
const pagination = computed(() => response.value?.meta?.pagination || { page: 1, pageCount: 1 });

// --- URL Syncing and Navigation ---
// Debounce the update to prevent excessive API calls while typing
const updateUrl = useDebounceFn(() => {
    router.push({
        query: {
            q: searchQuery.value || undefined,
            condition: conditionFilter.value || undefined,
            sort: sortOption.value,
            page: currentPage.value,
        }
    });
}, 300);

// Watch for changes in filters and update the URL
watch([searchQuery, conditionFilter, sortOption], () => {
    // When filters change, always go back to page 1
    currentPage.value = 1;
    updateUrl();
});

// Function to handle pagination clicks
const goToPage = (page) => {
    if (page > 0 && page <= pagination.value.pageCount) {
        currentPage.value = page;
        updateUrl();
    }
};

</script>