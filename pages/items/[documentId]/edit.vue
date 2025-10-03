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

                <!-- NOTE: Image handling (previews, removal, upload) is missing from the provided original template,
                     but normally required here. We focus only on fields present in the template. -->

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
// We use docId here as the unique ID for the item entity
const docId = route.params.documentId;

const { find, findOne, update, destroy } = useStrapi();
const client = useStrapiClient();
const user = useStrapiUser();


// Reactive state for the form
const form = reactive({
    name: '', itemStatus: 'Owned', description: '', isPrivate: false, purchasePrice: null, purchaseDate: null, manufacturer: '', character: '', series: '',
    categories: [], // Array of strings
    itags: [],       // Array of strings
    // We also need to store the current relational IDs for successful updates
    _manufacturerId: null,
    _characterId: null,
    _seriesId: null,
});

const loading = ref(false);
const errorMessage = ref(null);

// --- UTILITY FUNCTIONS (Reused from /items/new.vue) ---

const findOrCreateRelation = async (entityType, name) => {
    if (!name) return null;
    const cleanName = name.trim();

    const existing = await find(entityType, {
        filters: { name: { $eqi: cleanName } },
        pagination: { limit: 1 }
    });

    if (existing?.data?.length > 0) {
        return existing.data[0].id; // Return numerical ID
    }

    const newEntity = await client(`${entityType}`, {
        method: 'POST',
        body: { data: { name: cleanName } }
    });

    return newEntity?.data?.id; // Return numerical ID
};


// --- 1. Fetch data from Strapi ---
const { data: itemResponse, pending, error } = await useAsyncData(
    `item-edit-${docId}`,
    () => findOne('items', docId, {
        populate: ['manufacturer', 'character', 'series', 'categories', 'itags', 'user']
    }),
    { server: true }
);

// Process the raw Strapi response into a single flattened object for the template
const item = computed(() => {
    const rawItem = itemResponse.value;
    if (!rawItem || !rawItem.id) return null;

    // Security check: Ensure the logged-in user owns this item
    if (user.value?.id !== rawItem.user?.id) {
        // We cannot throw in a computed, but we can return null/handle in the template
        console.error("Access Denied: User does not own this item.");
        return null;
    }

    // Flatten relations (assuming V5 strict flattening)
    return {
        id: rawItem.id,
        name: rawItem.name,
        itemStatus: rawItem.itemStatus,
        description: rawItem.description,
        isPrivate: rawItem.isPrivate,
        purchasePrice: rawItem.purchasePrice,
        purchaseDate: rawItem.purchaseDate,

        // Relations: Flatten to name or name + ID for internal storage
        manufacturer: rawItem.manufacturer ? { name: rawItem.manufacturer.name, id: rawItem.manufacturer.id } : null,
        character: rawItem.character ? { name: rawItem.character.name, id: rawItem.character.id } : null,
        series: rawItem.series ? { name: rawItem.series.name, id: rawItem.series.id } : null,

        categories: rawItem.categories?.length ? rawItem.categories.map(c => ({ name: c.name, id: c.id })) : [],
        itags: rawItem.itags?.length ? rawItem.itags.map(t => ({ name: t.name, id: t.id })) : [],
    };
});


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

        // Pre-fill text inputs and store existing IDs
        form.manufacturer = newItem.manufacturer?.name || '';
        form._manufacturerId = newItem.manufacturer?.id || null;
        form.character = newItem.character?.name || '';
        form._characterId = newItem.character?.id || null;
        form.series = newItem.series?.name || '';
        form._seriesId = newItem.series?.id || null;

        // Pre-fill TagInput arrays (just names)
        form.categories = (newItem.categories || []).map(c => c.name);
        form.itags = (newItem.itags || []).map(t => t.name);
    }
}, { immediate: true });

useHead({ title: () => item.value ? `Editing: ${item.value.name}` : 'Edit Item' });


// --- 3. Handle the UPDATE request ---
const handleUpdate = async () => {
    if (!item.value) return;

    loading.value = true;
    errorMessage.value = null;

    try {
        // A. Resolve Relations: We only need to check/create if the string name changed
        const [
            manufacturerId,
            characterId,
            seriesId,
            categoryIds,
            tagIds
        ] = await Promise.all([
            // Use existing ID if name hasn't changed, otherwise find/create new
            form.manufacturer === item.value.manufacturer?.name ? item.value.manufacturer.id : findOrCreateRelation('manufacturers', form.manufacturer),
            form.character === item.value.character?.name ? item.value.character.id : findOrCreateRelation('characters', form.character),
            form.series === item.value.series?.name ? item.value.series.id : findOrCreateRelation('serieses', form.series),

            // Categories/Tags require finding/creating ALL tags/categories in the current form array
            Promise.all(form.categories.map(c => findOrCreateRelation('categories', c))),
            Promise.all(form.itags.map(t => findOrCreateRelation('itags', t)))
        ]);


        // B. Construct Final JSON Payload
        const updatePayload = {
            name: form.name,
            itemStatus: form.itemStatus,
            description: form.description,
            isPrivate: form.isPrivate,
            purchasePrice: form.purchasePrice,
            purchaseDate: form.purchaseDate,

            // Relational IDs
            manufacturer: manufacturerId,
            character: characterId,
            series: seriesId,
            categories: categoryIds.filter(Boolean),
            itags: tagIds.filter(Boolean),

            // NOTE: If you added image editing later, it would involve a multipart request here, 
            // similar to `/profile/edit.vue` or a dedicated upload step followed by this PUT.
        };

        // C. Execute the PUT request
        await update('items', docId, { data: updatePayload });

        // Redirect back to the item page
        router.push(`/items/${docId}`);
    } catch (e) {
        errorMessage.value = e.response?.data?.error?.message || "Failed to update item.";
        console.error(e.response?.data || e);
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
            // Execute the DELETE request using the item ID
            await destroy('items', docId);

            // Redirect to the personal shelf after deletion
            router.push('/my-shelf');
        } catch (e) {
            errorMessage.value = e.response?.data?.error?.message || "Failed to delete item.";
            console.error(e.response?.data || e);
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