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

            <!-- Statistics Cards -->
            <div v-if="!pending" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p class="text-3xl font-bold text-blue-600">{{ itemStats.total }}</p>
                    <p class="text-sm font-medium text-gray-500">Total Items</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p class="text-3xl font-bold text-green-600">{{ itemStats.owned }}</p>
                    <p class="text-sm font-medium text-gray-500">Owned</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p class="text-3xl font-bold text-yellow-600">{{ itemStats.wishlist }}</p>
                    <p class="text-sm font-medium text-gray-500">On Wishlist</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p class="text-3xl font-bold text-purple-600">{{ itemStats.preordered }}</p>
                    <p class="text-sm font-medium text-gray-500">Pre-ordered</p>
                </div>
            </div>

            <!-- Filter Buttons -->
            <div class="flex flex-wrap gap-2 mb-6">
                <button v-for="status in filterOptions" :key="status" @click="activeFilter = status" class="py-2 px-4 rounded-full text-sm font-semibold transition-colors" :class="activeFilter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'">
                    {{ status }}
                </button>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="text-center text-gray-500 py-10">Loading your items...</div>

            <!-- Empty State (after filtering) -->
            <div v-else-if="filteredItems.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold text-gray-800">No items found</h3>
                <p class="text-gray-500 mt-2">You don't have any items with the status "{{ activeFilter }}".</p>
            </div>

            <!-- Items Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <ItemCard v-for="item in filteredItems" :key="item.id" :item="item" />
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
    `my-shelf-${user.value?.id}`,
    async () => {
        if (!user.value?.id) return { data: [] };

        const queryParams = {
            populate: { userImages: { fields: ['url'] } },
            filters: { user: { id: { $eq: user.value.id } } },
            sort: 'createdAt:desc',
        };
        const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });
        const fullUrl = `${config.public.strapi.url}/api/items?${queryString}`;

        return await $fetch(fullUrl);
    },
    {
        transform: (response) => {
            if (!response?.data) return [];
            return response.data.map(item => ({ id: item.id, ...item }));
        },
        watch: [() => user.value?.id]
    }
);

if (process.client) {
    watch(items, (newItems) => {
        console.log('✅ Final Transformed items data:', newItems);
    }, { immediate: true });
}

const filterOptions = ['All', 'Owned', 'Wishlist', 'Pre-ordered', 'For Sale'];
const activeFilter = ref('All');

const filteredItems = computed(() => {
    if (!items.value) return [];
    if (activeFilter.value === 'All') return items.value;
    return items.value.filter(item => item.itemStatus === activeFilter.value);
});

const itemStats = computed(() => {
    if (!items.value) return { total: 0, owned: 0, wishlist: 0, preordered: 0 };
    return {
        total: items.value.length,
        owned: items.value.filter(i => i.itemStatus === 'Owned').length,
        wishlist: items.value.filter(i => i.itemStatus === 'Wishlist').length,
        preordered: items.value.filter(i => i.itemStatus === 'Pre-ordered').length,
    };
});

// The inline ItemCard definition is now GONE.
// Nuxt will auto-import the component from `/components/ItemCard.vue`.
</script>