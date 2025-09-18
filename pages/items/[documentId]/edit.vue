<template>
    <div class="bg-gray-100 min-h-screen py-12 px-4">
        <!-- Loading/Error States -->
        <div v-if="pending" class="text-center py-20 text-gray-500">Loading item for editing...</div>
        <div v-else-if="error || !item" class="text-center py-20">
            <h2 class="text-xl font-semibold text-red-600">Could not load item</h2>
            <p class="text-gray-500">{{ error?.data?.statusMessage || "An unknown error occurred." }}</p>
        </div>

        <!-- The Form -->
        <div v-else class="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">Edit Item</h1>

            <form @submit.prevent="handleUpdate">
                <!-- Item Name -->
                <div class="mb-4">
                    <label for="name" class="block text-gray-700 text-sm font-bold mb-2">Item Name *</label>
                    <input v-model="form.name" type="text" id="name" required class="form-input">
                </div>

                <!-- Item Status -->
                <div class="mb-4">
                    <label for="status" class="block text-gray-700 text-sm font-bold mb-2">Status *</label>
                    <select v-model="form.itemStatus" id="status" required class="form-input">
                        <option>Owned</option>
                        <option>Wishlist</option>
                        <option>Pre-ordered</option>
                        <option>For Sale</option>
                    </select>
                </div>

                <!-- Relations -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-4">
                    <div>
                        <label for="manufacturer" class="block text-gray-700 text-sm font-bold mb-2">Manufacturer</label>
                        <input v-model="form.manufacturer" id="manufacturer" type="text" placeholder="e.g., Good Smile Company" class="form-input">
                    </div>
                    <div>
                        <label for="character" class="block text-gray-700 text-sm font-bold mb-2">Character</label>
                        <input v-model="form.character" id="character" type="text" placeholder="e.g., Hatsune Miku" class="form-input">
                    </div>
                    <div>
                        <label for="series" class="block text-gray-700 text-sm font-bold mb-2">Series</label>
                        <input v-model="form.series" id="series" type="text" placeholder="e.g., Vocaloid" class="form-input">
                    </div>
                </div>

                <div class="mb-4">
                    <label for="categories" class="block text-gray-700 text-sm font-bold mb-2">Categories</label>
                    <TagInput v-model="form.categories" placeholder="e.g., Nendoroid, Limited" />
                </div>

                <div class="mb-4">
                    <label for="itags" class="block text-gray-700 text-sm font-bold mb-2">Tags</label>
                    <TagInput v-model="form.itags" placeholder="e.g., rare, custom paint" />
                </div>

                <!-- Purchase Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label for="purchase-price" class="block text-gray-700 text-sm font-bold mb-2">Purchase Price</label>
                        <input v-model.number="form.purchasePrice" id="purchase-price" type="number" placeholder="e.g., 89.99" class="form-input" step="0.01">
                    </div>
                    <div>
                        <label for="purchase-date" class="block text-gray-700 text-sm font-bold mb-2">Acquired On</label>
                        <input v-model="form.purchaseDate" id="purchase-date" type="date" class="form-input">
                    </div>
                </div>

                <!-- Notes -->
                <div class="mb-6">
                    <label for="description" class="block text-gray-700 text-sm font-bold mb-2">My Notes</label>
                    <textarea v-model="form.description" id="description" rows="4" class="form-input" placeholder="Any details about this item..."></textarea>
                </div>

                <!-- Privacy Toggle -->
                <div class="mb-6">
                    <label for="isPrivate" class="flex items-center cursor-pointer">
                        <div class="relative">
                            <input type="checkbox" id="isPrivate" class="sr-only peer" v-model="form.isPrivate">
                            <div class="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-green-300 transition-colors"></div>
                            <div class="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-full"></div>
                        </div>
                        <div class="ml-3 text-gray-700 font-medium">Keep this item private</div>
                    </label>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col-reverse sm:flex-row sm:justify-between items-center mt-8 pt-6 border-t border-gray-200">
                    <button @click="handleDelete" type="button" :disabled="loading" class="text-red-600 hover:text-red-800 font-semibold text-sm mt-4 sm:mt-0 disabled:opacity-50">
                        Delete Item
                    </button>
                    <button type="submit" :disabled="loading" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none disabled:bg-blue-400">
                        {{ loading ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
                <p v-if="errorMessage" class="text-red-500 text-center mt-4">{{ errorMessage }}</p>
            </form>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const docId = route.params.documentId;

// Reactive state for the form
const form = reactive({
    name: '', itemStatus: 'Owned', description: '', isPrivate: false, purchasePrice: null, purchaseDate: null, manufacturer: '', character: '', series: '',
    categories: [],
    itags: [],
});
const loading = ref(false);
const errorMessage = ref(null);

// --- 1. Fetch data from our secure BFF endpoint ---
const { data: item, pending, error } = await useAsyncData(
    `item-edit-${docId}`,
    () => $fetch(`/api/items/${docId}/edit`)
);

// --- 2. Pre-fill the form once the data is fetched ---
watch(item, (newItem) => {
    if (newItem) {
        const formatDateForInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : null;
        form.name = newItem.name || '';
        form.itemStatus = newItem.itemStatus || 'Owned';
        form.description = newItem.description || '';
        form.isPrivate = newItem.isPrivate || false;
        form.purchasePrice = newItem.purchasePrice;
        form.purchaseDate = formatDateForInput(newItem.purchaseDate);
        form.manufacturer = newItem.manufacturer?.name || '';
        form.character = newItem.character?.name || '';
        form.series = newItem.series?.name || '';
        form.categories = (newItem.categories || []).map(c => c.name);
        form.itags = (newItem.itags || []).map(t => t.name);
    }
}, { immediate: true });

useHead({ title: () => item.value ? `Editing: ${item.value.name}` : 'Edit Item' });

// --- 3. Handle the UPDATE request ---
const handleUpdate = async () => {
    loading.value = true;
    errorMessage.value = null;
    try {
        // The payload now includes the numerical `id` which the BFF endpoint needs.
        const payload = {
            itemId: item.value.documentId || item.value.id,
            ...form
        };

        await $fetch('/api/items/update', {
            method: 'PUT',
            body: payload
        });

        // Redirect back to the item page using the string `documentId`
        router.push(`/items/${docId}`);
    } catch (e) {
        errorMessage.value = e.data?.statusMessage || "Failed to update item.";
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// --- 4. Handle the DELETE request ---
const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
        loading.value = true;
        errorMessage.value = null;
        try {
            await $fetch('/api/items/delete', {
                method: 'DELETE',
                body: {
                    // Send the numerical `id` to the BFF endpoint for deletion
                    itemId: item.value.documentId || item.value.id
                }
            });
            // Redirect to the personal shelf after deletion
            router.push('/my-shelf');
        } catch (e) {
            errorMessage.value = e.data?.statusMessage || "Failed to delete item.";
            console.error(e);
        } finally {
            loading.value = false;
        }
    }
};
</script>

<style scoped>
.form-input {
    @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>