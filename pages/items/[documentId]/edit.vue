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

                <!-- Image Editing Section -->
                <div class="mb-8 border border-gray-200 p-6 rounded-lg bg-gray-50">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">Item Gallery ({{ existingImages.length + newImageFiles.length }} images)</h2>

                    <!-- Existing Images Grid -->
                    <div v-if="existingImages.length > 0" class="mb-6">
                        <h3 class="text-sm font-semibold mb-2 text-gray-700">Current Images:</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div v-for="image in existingImages" :key="image.id" class="relative border rounded-lg overflow-hidden transition-all duration-200" :class="{ 'opacity-50 border-red-500 ring-2 ring-red-500': isMarkedForDeletion(image.id) }">
                                <img :src="image.url" :alt="image.name" class="w-full h-24 object-cover">

                                <!-- Overlay button to mark for deletion -->
                                <button type="button" @click="toggleDeleteExistingImage(image.id)" class="absolute top-0 right-0 m-1 p-1 rounded-full bg-white text-red-600 hover:bg-red-100 shadow" :title="isMarkedForDeletion(image.id) ? 'Undo Remove' : 'Mark for Removal'">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path v-if="isMarkedForDeletion(image.id)" d="M5 3a1 1 0 000 2h10a1 1 0 100-2H5zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM4 14a1 1 0 011-1h7a1 1 0 110 2H5a1 1 0 01-1-1z" />
                                        <path v-else fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <div v-if="isMarkedForDeletion(image.id)" class="absolute inset-0 bg-red-100/50 flex items-center justify-center text-red-700 font-bold">REMOVED</div>
                            </div>
                        </div>
                    </div>

                    <!-- New Image Upload Dropzone -->
                    <h3 class="text-sm font-semibold mb-2 mt-6 text-gray-700">Add New Images:</h3>
                    <div>
                        <label for="item-image-upload" class="cursor-pointer inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.5 13a3.5 3.5 0 01-3.5-3.5V7.5a3.5 3.5 0 117 0v2A3.5 3.5 0 015.5 13zM15 4a1 1 0 100 2h1a1 1 0 100-2h-1zM4 14a1 1 0 100 2h1a1 1 0 100-2H4zM10.5 7.5a1 1 0 00-2 0v2a1 1 0 102 0v-2z"></path>
                            </svg>
                            Select Files
                        </label>
                        <!-- Note the 'multiple' attribute -->
                        <input id="item-image-upload" type="file" @change="onFilesChange" class="hidden" accept="image/*" multiple />

                        <p class="mt-2 text-xs text-gray-500">Select multiple JPG, PNG, GIF files.</p>
                    </div>

                    <!-- List of Newly Selected Files -->
                    <div v-if="newImageFiles.length" class="mt-4 border-t border-gray-200 pt-4">
                        <h4 class="text-sm font-medium mb-2">Files pending upload:</h4>
                        <ul class="space-y-2">
                            <li v-for="(file, index) in newImageFiles" :key="index" class="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                <span class="text-sm text-yellow-800">{{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(2) }} MB)</span>
                                <button type="button" @click="removeNewImage(index)" class="text-red-500 hover:text-red-700 text-sm font-medium ml-4">Remove</button>
                            </li>
                        </ul>
                    </div>
                </div>
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

                <div class="mb-6">
                    <label for="review" class="block text-gray-700 text-sm font-bold mb-2">My Notes</label>
                    <textarea v-model="form.review" id="review" rows="4" class="form-input" placeholder="Any review about this item..."></textarea>
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


// --- Image State for Multiple Files ---
const newImageFiles = ref([]); // Holds File objects for new uploads
const existingImages = ref([]); // Holds [{ id, url, name }] objects for currently saved images
const imagesToDelete = ref([]); // Holds IDs of existing images marked for deletion

// Helper to construct the full URL
const getImageUrl = (mediaObject) => {
    if (!mediaObject || !mediaObject.url) return '/placeholder-item.png';
    return mediaObject.url;
};


// Reactive state for the form
const form = reactive({
    name: '', itemStatus: 'Owned', description: '', isPrivate: false, purchasePrice: null, purchaseDate: null, manufacturer: '', character: '', series: '',
    categories: [], // Array of strings
    itags: [],       // Array of strings
    review: '',
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
        fields: ["name", "itemStatus", "description", "isPrivate", "purchasePrice", "purchaseDate", "review"],
        populate: ['userImages', 'manufacturer', 'series', 'categories', 'itags', 'likedBy', 'user.profilePicture']// Fetch all relations for editing
    })
);

console.log("Fetched Item for Editing:", itemResponse.value);

// Process the raw Strapi response into a single flattened object for the template
const item = computed(() => {
    const rawItem = itemResponse.value?.data;
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
        review: rawItem.review,
        userImages: rawItem.userImages || [],

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
        form.review = newItem.review || '';
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

        // Reset image states
        newImageFiles.value = [];
        imagesToDelete.value = [];

        // Load existing images from the gallery relation
        if (newItem.userImages?.length) {
            existingImages.value = newItem.userImages.map(img => ({
                id: img.id,
                url: getImageUrl(img),
                name: img.name // or other necessary metadata
            }));
        } else {
            existingImages.value = [];
        }
    }
}, { immediate: true });

useHead({ title: () => item.value ? `Editing: ${item.value.name}` : 'Edit Item' });

const onFilesChange = (e) => {
    const files = Array.from(e.target.files);
    newImageFiles.value.push(...files);
};

// Handle removing a newly selected image (before upload)
const removeNewImage = (index) => {
    // Revoke the local URL if necessary (though not strictly needed if we don't display a preview)
    newImageFiles.value.splice(index, 1);
};

// Handle marking an existing image for deletion
const toggleDeleteExistingImage = (imageId) => {
    const index = imagesToDelete.value.indexOf(imageId);
    if (index === -1) {
        // Mark for deletion
        imagesToDelete.value.push(imageId);
    } else {
        // Unmark
        imagesToDelete.value.splice(index, 1);
    }
};

// Helper to check if an image is marked for deletion (used for styling)
const isMarkedForDeletion = (imageId) => {
    return imagesToDelete.value.includes(imageId);
};

// --- 3. Handle the UPDATE request ---
const handleUpdate = async () => {
    if (!item.value) return;

    loading.value = true;
    errorMessage.value = null;

    try {

        let finalImageIds = [];

        // A. 1. Process Existing Images
        // Start with IDs of images that are NOT marked for deletion
        const keptExistingIds = existingImages.value
            .filter(img => !isMarkedForDeletion(img.id))
            .map(img => img.id);

        finalImageIds.push(...keptExistingIds);

        // A. 2. Handle New File Uploads
        if (newImageFiles.value.length > 0) {
            const formData = new FormData();

            // Append all new files under the 'files' key
            newImageFiles.value.forEach(file => {
                formData.append('files', file);
            });

            const uploadedFiles = await client('/upload', {
                method: "POST",
                body: formData,
            });

            // Add the IDs of the newly uploaded files to the final array
            const newUploadedIds = uploadedFiles.map(file => file.id);
            finalImageIds.push(...newUploadedIds);
        }
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
            review: form.review,

            // Relational IDs
            manufacturer: manufacturerId,
            character: characterId,
            series: seriesId,
            categories: categoryIds.filter(Boolean),
            itags: tagIds.filter(Boolean),

            userImages: finalImageIds,
            // NOTE: If you added image editing later, it would involve a multipart request here, 
            // similar to `/profile/edit.vue` or a dedicated upload step followed by this PUT.
        };

        // C. Execute the PUT request
        await update('items', docId, updatePayload);

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