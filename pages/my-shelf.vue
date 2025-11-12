<template>
    <div class="bg-gray-50 text-gray-800">

        <main class="max-w-screen-xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

            <!-- Page Header -->
            <div class="mb-8">
                <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to home
                </NuxtLink>
                <h1 class="text-5xl font-bold text-gray-900">My Collection</h1>
                <p class="mt-2 text-xl text-gray-600">View and manage your collectibles in one organized shelf.</p>
            </div>

            <!-- Stats Summary -->
            <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                <dl class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    <div class="pt-6 md:pt-0">
                        <dt class="text-base font-medium text-gray-500">Total Items</dt>
                        <dd class="mt-1 text-4xl font-semibold text-gray-900 tracking-tight">{{ totalItems }}</dd>
                    </div>
                    <div class="pt-6 md:pt-0">
                        <dt class="text-base font-medium text-gray-500">Categories</dt>
                        <dd class="mt-1 text-4xl font-semibold text-gray-900 tracking-tight">{{ totalCategories }}</dd>
                    </div>
                    <div class="pt-6 md:pt-0">
                        <dt class="text-base font-medium text-gray-500">Estimated Value</dt>
                        <dd class="mt-1 text-4xl font-semibold text-gray-900 tracking-tight">{{ formattedEstimatedValue }}</dd>
                    </div>
                </dl>
            </div>


            <!-- Search and Filter Bar -->
            <div class="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="relative flex-grow">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <input type="text" v-model="searchQuery" placeholder="Search by name or tag..." class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                    <select v-model="filters.category" class="filter-button appearance-none">
                        <option value="All">Category</option>
                        <option v-for="option in categoryOptions.filter(o => o !== 'All')" :key="option" :value="option">{{ option }}</option>
                    </select>
                    <select v-model="filters.status" class="filter-button appearance-none">
                        <option value="All">Status</option>
                        <option v-for="option in statusOptions.filter(o => o !== 'All')" :key="option" :value="option">{{ option }}</option>
                    </select>

                    <div class="flex items-center bg-gray-200 rounded-lg p-1 ml-2">
                        <button @click="viewMode = 'grid'" :class="[viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500', 'p-1.5 rounded-md']">
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button @click="viewMode = 'list'" :class="[viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500', 'p-1.5 rounded-md']">
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div class="relative ml-2">
                        <!-- Premium User View -->
                        <div v-if="isPremium">
                            <button @click="showExportMenu = !showExportMenu" type="button" class="filter-button inline-flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Export
                            </button>
                            <div v-if="showExportMenu" @click="showExportMenu = false" class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div class="py-1" role="none">
                                    <a href="#" @click.prevent="exportToCSV" class="text-gray-700 hover:bg-gray-100 block px-4 py-2 text-sm" role="menuitem">Export as CSV</a>
                                    <a href="#" @click.prevent="exportToPDF" class="text-gray-700 hover:bg-gray-100 block px-4 py-2 text-sm" role="menuitem">Export as PDF</a>
                                </div>
                            </div>
                        </div>
                        <!-- Non-Premium User View (Upsell) -->
                        <div v-else class="relative group">
                            <button type="button" disabled class="filter-button inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                Export
                            </button>
                            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-gray-800 text-white text-center text-sm rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                Upgrade to Premium to export your collection.
                                <NuxtLink to="/pricing" class="font-bold text-blue-400 hover:underline">Upgrade Now</NuxtLink>
                                <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
                            </div>
                        </div>
                    </div>

                    <NuxtLink to="/items/new" class="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-lg transition-colors ml-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Item
                    </NuxtLink>
                </div>
            </div>

            <!-- Content Area -->
            <div class="mt-6">
                <!-- Loading State -->
                <div v-if="itemsPending" class="text-center text-gray-500 py-10">
                    Loading your items...
                </div>

                <!-- Empty State -->
                <div v-else-if="!items || items.length === 0" class="text-center bg-white p-10 rounded-lg border border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-800">Your collection is empty!</h3>
                    <p class="text-gray-500 mt-2">Start by adding your first collectible.</p>
                    <NuxtLink to="/items/new" class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Add Your First Item</NuxtLink>
                </div>

                <!-- Items Display -->
                <div v-else>
                    <div v-if="filteredItems.length === 0" class="text-center bg-white p-10 rounded-lg border border-gray-200">
                        <h3 class="text-xl font-semibold text-gray-800">No items match your search or filters</h3>
                        <p class="text-gray-500 mt-2">Try adjusting your criteria.</p>
                    </div>

                    <!-- GRID VIEW -->
                    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <div v-for="item in filteredItems" :key="item.id" class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                            <NuxtLink :to="`/items/${item.id}`" class="block hover:underline">
                                <div class="relative">
                                    <img :src="item.userImages[0]?.url || 'https://via.placeholder.com/400x300'" :alt="item.name" class="w-full h-56 object-cover">
                                    <div class="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                        </svg>

                                        {{ item.userImages.length }}
                                    </div>
                                    <span :class="getStatusClass(item.itemStatus)" class="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full">
                                        {{ item.itemStatus }}
                                    </span>
                                </div>
                                <div class="p-4">
                                    <h3 class="font-bold text-lg text-gray-900 truncate">{{ item.name }}</h3>
                                    <p class="text-sm text-gray-500">{{ item.categories[0] || 'Uncategorized' }}</p>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        <span v-for="tag in item.itags.slice(0, 3)" :key="tag" class="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {{ tag }}
                                        </span>
                                    </div>
                                </div>
                            </NuxtLink>
                        </div>
                    </div>

                    <!-- LIST VIEW -->
                    <div v-else-if="viewMode === 'list'" class="space-y-4">
                        <div v-for="item in filteredItems" :key="item.id" class="bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-6 hover:shadow-md transition-shadow duration-300">
                            <NuxtLink :to="`/items/${item.id}`" class="flex items-center space-x-6 w-full hover:underline">
                                <div class="relative flex-shrink-0">
                                    <img :src="item.userImages[0]?.url || 'https://via.placeholder.com/150'" :alt="item.name" class="w-24 h-24 rounded-md object-cover">
                                    <div class="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                        </svg>

                                        {{ item.userImages.length }}
                                    </div>
                                </div>
                                <div class="flex-grow">
                                    <span :class="getStatusClass(item.itemStatus)" class="text-xs font-semibold px-2.5 py-1 rounded-full">{{ item.itemStatus }}</span>
                                    <h3 class="font-bold text-lg text-gray-900 mt-2">{{ item.name }}</h3>
                                    <p class="text-sm text-gray-500">{{ item.categories[0] || 'Uncategorized' }}</p>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                        <span v-for="tag in item.itags" :key="tag" class="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {{ tag }}
                                        </span>
                                    </div>
                                </div>
                            </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer (Placeholder based on UI) -->
        <footer class="bg-gray-900 text-gray-400">
            <div class="max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div class="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div class="space-y-8 xl:col-span-1">
                        <span class="text-3xl font-bold text-white">Shelfie</span>
                        <p class="text-gray-400 text-base">The ultimate digital shelf for collectors.</p>
                        <div class="flex space-x-6">
                            <!-- Social Icons -->
                        </div>
                    </div>
                    <div class="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
                        <div class="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 class="text-sm font-semibold text-gray-200 tracking-wider uppercase">Company</h3>
                                <ul class="mt-4 space-y-4">
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">About</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Careers</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Blog</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Press</a></li>
                                </ul>
                            </div>
                            <div class="mt-12 md:mt-0">
                                <h3 class="text-sm font-semibold text-gray-200 tracking-wider uppercase">Resources</h3>
                                <ul class="mt-4 space-y-4">
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Features</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Pricing</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">FAQ</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Support</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="md:grid md:grid-cols-1 md:gap-8">
                            <div>
                                <h3 class="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
                                <ul class="mt-4 space-y-4">
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Privacy</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Terms</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Cookies</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white">Licenses</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-12 border-t border-gray-700 pt-8">
                    <p class="text-base text-gray-500 xl:text-center">&copy; {{ new Date().getFullYear() }} Shelfie. All rights reserved.</p>
                </div>
            </div>
        </footer>

    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Collection | Shelfie' });

const user = useStrapiUser();
const { find } = useStrapi();

const { isPremium } = usePremiumStatus();
// --- UI STATE ---
const searchQuery = ref('');
const viewMode = ref('grid'); // Default to 'grid' view
const showExportMenu = ref(false); // New state for export dropdown

// --- DATA FETCHING (Largely unchanged) ---
const { data: itemsResponse, pending: itemsPending } = await useAsyncData(
    "my-shelf-all-items",
    async () => {
        const userId = user.value?.id;
        if (!userId) return null;
        return await find('items', {
            populate: "*",
            filters: { user: { id: { '$eq': userId } } },
            pagination: { pageSize: 2500 },
            sort: ['createdAt:desc'],
        });
    },
    {
        transform: (response) => {
            if (!response?.data) return [];
            return response.data.map((item) => ({
                id: item.documentId,
                name: item.name,
                itemStatus: item.itemStatus || 'Owned',
                purchasePrice: item.purchasePrice,
                categories: item.categories?.map(c => c.name) || [],
                itags: item.itags?.map(t => t.name) || [],
                userImages: item.userImages?.map(img => ({ id: img.id, url: img.url })) || [],
            }));
        },
        watch: [() => user.value?.id],
    }
);
const items = computed(() => itemsResponse.value || []);


// --- COMPUTED PROPERTIES FOR STATS ---
const totalItems = computed(() => items.value?.length || 0);
const totalCategories = computed(() => {
    if (!items.value) return 0;
    const allCategories = items.value.flatMap(item => item.categories);
    return new Set(allCategories).size;
});
const estimatedValue = computed(() => {
    if (!items.value) return 0;
    return items.value.reduce((total, item) => total + (Number(item.purchasePrice) || 0), 0);
});
const formattedEstimatedValue = computed(() => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(estimatedValue.value);
});


// --- FILTERING LOGIC ---
const filters = reactive({
    status: 'All',
    category: 'All',
});

const statusOptions = computed(() => {
    const statuses = new Set(items.value?.map(item => item.itemStatus) || []);
    return ['All', ...Array.from(statuses).sort()];
});

const categoryOptions = computed(() => {
    const categories = new Set();
    items.value?.forEach(item => item.categories.forEach(cat => categories.add(cat)));
    return ['All', ...Array.from(categories).sort()];
});

const filteredItems = computed(() => {
    if (!items.value) return [];
    const lowerCaseQuery = searchQuery.value.toLowerCase();

    return items.value.filter(item => {
        const matchesStatus = filters.status === 'All' || item.itemStatus === filters.status;
        const matchesCategory = filters.category === 'All' || item.categories.includes(filters.category);
        const matchesSearch = lowerCaseQuery === '' ||
            item.name.toLowerCase().includes(lowerCaseQuery) ||
            item.itags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));

        return matchesStatus && matchesCategory && matchesSearch;
    });
});

// Helper for card styling
const getStatusClass = (status) => {
    switch (status) {
        case 'Owned': return 'bg-green-100 text-green-800';
        case 'Wishlist': return 'bg-blue-100 text-blue-800';
        case 'For Trade': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}


// NEW SECTION START: EXPORT LOGIC
const exportToCSV = async () => {
    if (process.server) return;
    if (!isPremium.value) {
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
    showExportMenu.value = false;
};

const exportToPDF = async () => {
    if (process.server) return;
    if (!isPremium.value) {
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
    const tableColumn = ["Name", "Status", "Manufacturer", "Series", "Character", "Purchase Date", "Price", "Review", "Description"];
    const tableRows = filteredItems.value.map(item => [
        item.name,
        item.itemStatus,
        item.manufacturer || '-',
        item.series || '-',
        item.character || '-',
        item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '-',
        item.purchasePrice ? `$${item.purchasePrice}` : '-',
        item.review || '-',
        item.description ? item.description.substring(0, 30) + (item.description.length > 30 ? '...' : '') : '-'
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
    showExportMenu.value = false;
};
</script>

<style scoped>
.filter-button {
    @apply flex items-center bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

select.filter-button {
    @apply pr-8;
    /* Add padding for the default arrow */
}
</style>