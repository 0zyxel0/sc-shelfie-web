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
                    <div class="relative" ref="exportMenuRef">
                        <button @click="isExportMenuOpen = !isExportMenuOpen" class="flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </button>
                        <div v-if="isExportMenuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20">
                            <div class="py-1">
                                <a href="#" @click.prevent="exportToCSV" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as CSV</a>
                                <a href="#" @click.prevent="exportToPDF" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export as PDF</a>
                            </div>
                        </div>
                    </div>
                </div>
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
                <div class="w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <div class="sticky top-24 bg-white p-4 rounded-lg shadow-md">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Filter My Shelf</h3>
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

// --- NEW: State for export dropdown ---
const isExportMenuOpen = ref(false);
const exportMenuRef = ref(null);

// --- NEW: Click-outside logic for the dropdown ---
onMounted(() => {
    const handler = (event) => {
        if (exportMenuRef.value && !exportMenuRef.value.contains(event.target)) {
            isExportMenuOpen.value = false;
        }
    };
    document.addEventListener('click', handler, true);
    onBeforeUnmount(() => {
        document.removeEventListener('click', handler, true);
    });
});


// --- The rest of your working code remains untouched ---
const { data: items, pending } = await useAsyncData(
    `my-shelf-all-items-${user.value?.id}`,
    async () => {
        if (!user.value?.id) return { data: [] };
        const query = qs.stringify({
            populate: ['userImages', 'manufacturer', 'character', 'series', 'categories', 'itags'],
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
            // This handles the flattened structure: [{ id, name }, ...]
            return value.map(v => v[nestedKey]).filter(Boolean);
        }
        // This handles the flattened structure: { id, name }
        return value[nestedKey];
    });
    return ['All', ...new Set(allValues.filter(Boolean))].sort();
};

const statusOptions = computed(() => ['All', 'Owned', 'Wishlist', 'Pre-ordered', 'For Sale']);
const categoryOptions = computed(() => getUniqueOptions('categories'));
const manufacturerOptions = computed(() => getUniqueOptions('manufacturer'));
const seriesOptions = computed(() => getUniqueOptions('series'));
const tagOptions = computed(() => getUniqueOptions('itags'));

const resetFilters = () => {
    filters.status = 'All';
    filters.category = 'All';
    filters.manufacturer = 'All';
    filters.series = 'All';
    filters.tag = 'All';
};

// --- UPDATED: filteredItems with corrected transform logic ---
const filteredItems = computed(() => {
    if (!items.value) return [];
    return items.value.filter(item => {
        const statusMatch = filters.status === 'All' || item.itemStatus === filters.status;
        const categoryMatch = filters.category === 'All' || (item.categories && item.categories.some(c => c.name === filters.category));
        const manufacturerMatch = filters.manufacturer === 'All' || (item.manufacturer && item.manufacturer.name === filters.manufacturer);
        const seriesMatch = filters.series === 'All' || (item.series && item.series.name === filters.series);
        const tagMatch = filters.tag === 'All' || (item.itags && item.itags.some(t => t.name === filters.tag));
        return statusMatch && categoryMatch && manufacturerMatch && seriesMatch && tagMatch;
    });
});
// --- UPDATED EXPORT FUNCTIONS ---

const exportToCSV = async () => {
    // Guard to ensure this only runs in the browser
    if (process.server) return;

    // --- DYNAMIC, CLIENT-SIDE IMPORT ---
    const Papa = await import('papaparse').then(m => m.default || m);

    if (filteredItems.value.length === 0) {
        alert("No items to export.");
        return;
    }
    const dataForExport = filteredItems.value.map(item => ({
        Name: item.name,
        Status: item.itemStatus,
        Manufacturer: item.manufacturer?.data?.attributes.name || 'N/A',
        Series: item.series?.data?.attributes.name || 'N/A',
        Character: item.character?.data?.attributes.name || 'N/A',
        PurchasePrice: item.purchasePrice || 0,
        PurchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A',
        itags: (item.itags?.data || []).map(t => t.attributes.name).join(' | '),
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
    // Guard to ensure this only runs in the browser
    if (process.server) return;

    // --- DYNAMIC, CLIENT-SIDE IMPORTS ---
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
        item.manufacturer?.data?.attributes.name || '-',
        item.series?.data?.attributes.name || '-',
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
    @apply w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 mb-4;
}
</style>