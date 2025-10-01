<template>
    <div>
        <main class="container mx-auto py-8 px-4">

            <!-- Page Header -->
            <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
                <div>
                    <h1 class="text-4xl font-bold text-gray-800">My Shelf</h1>
                    <p class="mt-1 text-lg text-gray-600">Your personal collection, at a glance.</p>
                </div>

                <!-- Action Buttons Group -->
                <div class="flex items-center space-x-2 mt-4 md:mt-0">
                    <NuxtLink to="/items/new" class="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </NuxtLink>

                    <!-- === NEW: Export Dropdown === -->
                    <div class="relative" ref="exportMenuRef" @mouseenter="showPremiumHint = !isPremiumUser" @mouseleave="showPremiumHint = false">
                        <button @click="isExportMenuOpen = !isExportMenuOpen" :disabled="!isPremiumUser" class="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </button>

                        <!-- Export Dropdown for Premium Users -->
                        <div v-if="isExportMenuOpen && isPremiumUser" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20">
                            <div class="py-1">
                                <a href="#" @click.prevent="exportToCSV" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as CSV</a>
                                <a href="#" @click.prevent="exportToPDF" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as PDF</a>
                            </div>
                        </div>

                        <!-- Premium Hint/Tooltip for Free Users -->
                        <div v-if="showPremiumHint" class="absolute right-0 mt-2 w-64 bg-gray-800 text-white rounded-md shadow-xl z-20 p-4">
                            <h4 class="font-bold text-md">Premium Feature</h4>
                            <p class="text-sm mt-1">Export your collection to CSV or PDF with a Premium subscription.</p>
                            <NuxtLink to="/go-premium" class="mt-3 inline-block bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg text-sm">
                                Go Premium
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="userLoading || itemsPending" class="text-center text-gray-500 py-10">
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
                <div class="w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div class="sticky top-24 bg-white p-4 rounded-lg shadow-md">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Filter My Shelf</h3>
                        <!-- Only show filters if there's more than one distinct option (including "All") -->
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
                <div class="flex-1 w-full">
                    <div v-if="filteredItems.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
                        <h3 class="text-xl font-semibold text-gray-800">No items match your filters</h3>
                        <p class="text-gray-500 mt-2">Try adjusting or resetting your filters.</p>
                    </div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <!-- Assuming ItemCard component is available -->
                        <ItemCard v-for="item in filteredItems" :key="item.id" :item="item" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Shelf | Shelfie' });

const user = useStrapiUser();
const { find } = useStrapi(); // Import useStrapi

const isPremiumUser = computed(() => user.value?.subscriptionType === 'Premium');
const config = useRuntimeConfig();

// --- UTILITY FOR SAFELY EXTRACTING RELATIONS ---
/**
 * Helper to safely extract attributes from a populated Strapi relation object (V5 structure).
 */
const getRelationAttributes = (relation) => {
    if (!relation || !relation.data) return null;
    if (Array.isArray(relation)) {
        // Handle many relations (returns array of attributes)
        return relation.map(entry => ({ id: entry.id, ...entry }));
    }
    // Handle single relation (returns single object of attributes)
    return { id: relation.id, ...relation };
};


// --- DATA FETCHING: ITEMS (Using useStrapi) ---

const { data: itemsResponse, pending: itemsPending, error: itemsError } = await useAsyncData(
    "my-shelf-all-items",
    async () => {
        const userId = user.value?.id;
        if (!userId) return null; // Return null to signal no data if user ID is missing

        const itemQueryParams = {
            // Populate all required relations
            populate: ['userImages', 'manufacturer', 'character', 'series', 'categories', 'itags'],
            // Filter by the currently logged-in user ID
            filters: { user: { id: { '$eq': userId } } },
            pagination: { pageSize: 2500 }, // Fetch enough for the whole shelf
            sort: ['createdAt:desc'],
        };

        return await find('items', itemQueryParams);
    },
    {
        transform: (response) => {
            console.log("Raw items response:", response);
            if (!response?.data) return [];

            return response.data.map((rawItem) => {
                const item = rawItem;

                const transformedItem = { id: item.id, ...item };
                transformedItem.manufacturer = transformedItem.manufacturer?.name || null;
                transformedItem.series = transformedItem.series?.name || null;
                transformedItem.categories = transformedItem.categories?.length
                    ? transformedItem.categories.map(cat => cat.name)
                    : [];
                transformedItem.itags = transformedItem.itags?.length
                    ? transformedItem.itags.map(tag => tag.name)
                    : [];
                transformedItem.character = transformedItem.character?.name || null;
                transformedItem.userImages = transformedItem.userImages?.length
                    ? transformedItem.userImages.map(img => ({
                        id: img.id,
                        url: config.public.strapi.url + img.url,
                    }))
                    : [];
                return transformedItem;
            });
        },
        // Re-fetch whenever the user ID changes (i.e., when fetchUser resolves)
        watch: [() => user.value?.id],
        server: true,
    }
);

const items = computed(() => itemsResponse.value || []);
console.log("Transformed items:", items);

// --- Filter State & Logic (Unchanged) ---
const filters = reactive({
    status: 'All',
    category: 'All',
    manufacturer: 'All',
    series: 'All',
    tag: 'All',
});
const statusOptions = computed(() => {
    const statuses = new Set(items.value?.map(item => item.itemStatus) || []);
    return ['All', ...Array.from(statuses).sort()];
});
console.log("Status Options:", statusOptions.value);
const categoryOptions = computed(() => {
    const categories = new Set();
    items.value?.forEach(item => item.categories.forEach(cat => categories.add(cat)));
    return ['All', ...Array.from(categories).sort()];
});
console.log("Category Options:", categoryOptions.value);
const manufacturerOptions = computed(() => {
    const manufacturers = new Set(items.value?.map(item => item.manufacturer).filter(Boolean) || []);
    return ['All', ...Array.from(manufacturers).sort()];
});
console.log("Manufacturer Options:", manufacturerOptions.value);
const seriesOptions = computed(() => {
    const seriesList = new Set(items.value?.map(item => item.series).filter(Boolean) || []);
    return ['All', ...Array.from(seriesList).sort()];
});
console.log("Series Options:", seriesOptions.value);
const tagOptions = computed(() => {
    const tags = new Set();
    items.value?.forEach(item => item.itags.forEach(tag => tags.add(tag)));
    return ['All', ...Array.from(tags).sort()];
});
console.log("Tag Options:", tagOptions.value);
const filteredItems = computed(() => {
    if (!items.value) return [];
    return items.value.filter(item => {
        const matchesStatus = filters.status === 'All' || item.itemStatus === filters.status;
        const matchesCategory = filters.category === 'All' || item.categories.includes(filters.category);
        const matchesManufacturer = filters.manufacturer === 'All' || item.manufacturer === filters.manufacturer;
        const matchesSeries = filters.series === 'All' || item.series === filters.series;
        const matchesTag = filters.tag === 'All' || item.itags.includes(filters.tag);
        return matchesStatus && matchesCategory && matchesManufacturer && matchesSeries && matchesTag;
    });
});
const resetFilters = () => {
    filters.status = 'All';
    filters.category = 'All';
    filters.manufacturer = 'All';
    filters.series = 'All';
    filters.tag = 'All';
};

// --- Export Dropdown Logic (Unchanged) ---
const isExportMenuOpen = ref(false);
const showPremiumHint = ref(false);
const exportMenuRef = ref(null);
onClickOutside(exportMenuRef, () => {
    isExportMenuOpen.value = false;
    showPremiumHint.value = false; // Fix: Reset showPremiumHint on click outside
});

// --- CLIENT-SIDE EXPORT FUNCTIONS (Unchanged) ---
const exportToCSV = async () => {
    if (process.server) return;
    if (!isPremiumUser.value) {
        alert("This is a premium feature.");
        return;
    }
    const Papa = await import('papaparse').then(m => m.default || m);
    if (filteredItems.value.length === 0) {
        alert("No items to export.");
        return;
    }
    const dataForExport = filteredItems.value.map(item => ({
        Name: item.name,
        Status: item.itemStatus,
        Manufacturer: item.manufacturer || 'N/A',
        Series: item.series || 'N/A',
        Character: item.character || 'N/A',
        PurchasePrice: item.purchasePrice || 0,
        PurchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A',
        itags: item.itags.join(' | '),
    }));
    const csv = Papa.unparse(dataForExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "shelfie_collection.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    isExportMenuOpen.value = false;
};

const exportToPDF = async () => {
    if (process.server) return;
    if (!isPremiumUser.value) {
        alert("This is a premium feature.");
        return;
    }
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    if (filteredItems.value.length === 0) {
        alert("No items to export.");
        return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${user.value.username}'s Shelfie Collection`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const filterText = `Current Filter: ${filters.status}`;
    doc.text(filterText, 14, 30);
    const tableColumn = ["Name", "Status", "Manufacturer", "Series", "Price"];
    const tableRows = filteredItems.value.map(item => [
        item.name,
        item.itemStatus,
        item.manufacturer || '-',
        item.series || '-',
        item.purchasePrice ? `$${item.purchasePrice}` : '-',
    ]);
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 120, 190] },
    });
    doc.save('shelfie_collection.pdf');
    isExportMenuOpen.value = false;
};
</script>

<style scoped>
.filter-select {
    @apply w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500;
}
</style>