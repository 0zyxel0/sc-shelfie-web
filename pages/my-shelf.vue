<template>
    <div>
        <main class="container mx-auto py-8 px-4">

            <!-- Page Header -->
            <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
                <div>
                    <h1 class="text-4xl font-bold text-gray-800">My Shelf</h1>
                    <p class="mt-1 text-lg text-gray-600">Your personal collection, at a glance.</p>
                </div>
                <NuxtLink to="/items/new" class="mt-4 md:mt-0 w-full md:w-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Item
                </NuxtLink>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="text-center text-gray-500 py-10">
                Loading your items...
            </div>

            <!-- Empty State (No items at all) -->
            <div v-else-if="!items || items.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold text-gray-800">Your shelf is empty!</h3>
                <p class="text-gray-500 mt-2">Start by adding your first item.</p>
                <NuxtLink to="/items/new" class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Add Your First Item</NuxtLink>
            </div>

            <!-- Main Content Area with INLINE Filters -->
            <div v-else class="flex flex-col lg:flex-row gap-8 items-start">

                <!-- INLINE FILTER SIDEBAR -->
                <div class="w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div class="sticky top-24 bg-white p-4 rounded-lg shadow-md">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Filter My Shelf</h3>

                        <!-- We only render these dropdowns if the options are ready -->
                        <div v-if="manufacturerOptions.length > 1 || categoryOptions.length > 1 || seriesOptions.length > 1 || tagOptions.length > 1">
                            <div class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                <select v-model="filters.status" class="filter-select">
                                    <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                            </div>

                            <div v-if="categoryOptions.length > 1" class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                <select v-model="filters.category" class="filter-select">
                                    <option v-for="option in categoryOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                            </div>

                            <div v-if="manufacturerOptions.length > 1" class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Manufacturer</label>
                                <select v-model="filters.manufacturer" class="filter-select">
                                    <option v-for="option in manufacturerOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                            </div>

                            <div v-if="seriesOptions.length > 1" class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Series</label>
                                <select v-model="filters.series" class="filter-select">
                                    <option v-for="option in seriesOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                            </div>

                            <div v-if="tagOptions.length > 1" class="mb-4">
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Tag</label>
                                <select v-model="filters.tag" class="filter-select">
                                    <option v-for="option in tagOptions" :key="option" :value="option">{{ option }}</option>
                                </select>
                            </div>
                        </div>

                        <button @click="resetFilters" class="w-full mt-4 text-sm text-gray-600 hover:text-blue-600 font-semibold">
                            Reset All Filters
                        </button>
                    </div>
                </div>

                <!-- Items Display -->
                <div class="flex-1 w-full">
                    <div v-if="filteredItems.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
                        <h3 class="text-xl font-semibold text-gray-800">No items match your filters</h3>
                        <p class="text-gray-500 mt-2">Try adjusting or resetting your filters.</p>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <ItemCard v-for="item in filteredItems" :key="item.id" :item="item" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import qs from 'qs';

definePageMeta({
    middleware: 'auth'
});
useHead({ title: 'My Shelf | Shelfie' });

const user = useStrapiUser();
const config = useRuntimeConfig();

const { data: items, pending } = await useAsyncData(
    `my-shelf-all-items-${user.value?.id}`,
    async () => {
        if (!user.value?.id) return { data: [] };

        const query = qs.stringify({
            populate: ['userImages', 'manufacturer', 'character', 'series', 'categories', 'tags'],
            filters: { user: { id: { $eq: user.value.id } } },
            'pagination[pageSize]': 2500,
            sort: 'createdAt:desc',
        }, { encodeValuesOnly: true });

        const fullUrl = `${config.public.strapi.url}/api/items?${query}`;
        return await $fetch(fullUrl);
    },
    {
        transform: (response) => {
            if (!response?.data) return [];
            return response.data.map(item => ({ id: item.id, ...item }));
        }
    }
);

console.log('Fetched items:', items.value);

const filters = reactive({
    status: 'All',
    category: 'All',
    manufacturer: 'All',
    series: 'All',
    tag: 'All',
});

const getUniqueOptions = (key, nestedKey = 'name') => {
    if (!items.value) return ['All'];
    const allValues = items.value.flatMap(item => {
        const value = item[key];
        if (!value) return [];
        if (Array.isArray(value)) {
            return value.map(v => v.data ? v.data.attributes[nestedKey] : v[nestedKey]).filter(Boolean);
        }
        if (value.data) {
            return value.data.attributes[nestedKey];
        }
        return value[nestedKey];
    });
    return ['All', ...new Set(allValues.filter(Boolean))].sort();
};

const statusOptions = computed(() => ['All', 'Owned', 'Wishlist', 'Pre-ordered', 'For Sale']);
const categoryOptions = computed(() => getUniqueOptions('categories'));
const manufacturerOptions = computed(() => getUniqueOptions('manufacturer'));
const seriesOptions = computed(() => getUniqueOptions('series'));
const tagOptions = computed(() => getUniqueOptions('tags'));

const resetFilters = () => {
    filters.status = 'All';
    filters.category = 'All';
    filters.manufacturer = 'All';
    filters.series = 'All';
    filters.tag = 'All';
};

const filteredItems = computed(() => {
    if (!items.value) return [];
    return items.value.filter(item => {
        const statusMatch = filters.status === 'All' || item.itemStatus === filters.status;

        const categoryMatch = filters.category === 'All' ||
            (item.categories && item.categories.some(c => c.name === filters.category))
        const manufacturerMatch = filters.manufacturer === 'All' ||
            (item.manufacturer && item.manufacturer.name === filters.manufacturer);

        const seriesMatch = filters.series === 'All' ||
            (item.series && item.series.name === filters.series);

        const tagMatch = filters.tag === 'All' ||
            (item.tags && item.tags.some(t => t.name === filters.tag));

        return statusMatch && categoryMatch && manufacturerMatch && seriesMatch && tagMatch;
    });
});
</script>

<style scoped>
.filter-select {
    @apply w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 mb-4;
}
</style>