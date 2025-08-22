<template>
    <div class="bg-gray-100 min-h-screen py-12 px-4">
        <div class="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl">
            <h1 class="text-3xl font-bold text-gray-800 mb-6">Add a New Item to Your Shelf</h1>

            <form @submit.prevent="handleSubmit">
                <!-- Item Name -->
                <div class="mb-4">
                    <label for="name" class="block text-gray-700 text-sm font-bold mb-2">Item Name *</label>
                    <input v-model="form.name" type="text" id="name" required class="form-input">
                </div>

                <!-- Status (Updated v-model to form.itemStatus) -->
                <div class="mb-4">
                    <label for="status" class="block text-gray-700 text-sm font-bold mb-2">Status *</label>
                    <select v-model="form.itemStatus" id="status" required class="form-input">
                        <option>Owned</option>
                        <option>Wishlist</option>
                        <option>Pre-ordered</option>
                        <option>For Sale</option>
                    </select>
                </div>

                <!-- Image Upload -->
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Your Photos</label>
                    <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div class="space-y-1 text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                            <div class="flex text-sm text-gray-600">
                                <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                    <span>Upload files</span>
                                    <input id="file-upload" name="file-upload" type="file" class="sr-only" multiple accept="image/*" @change="handleFileChange">
                                </label>
                                <p class="pl-1">or drag and drop</p>
                            </div>
                            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>
                </div>

                <!-- Image Previews Section -->
                <div v-if="imagePreviews.length > 0" class="mb-6">
                    <p class="block text-gray-700 text-sm font-bold mb-2">Image Previews</p>
                    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        <div v-for="(src, index) in imagePreviews" :key="index" class="relative">
                            <img :src="src" class="w-full h-24 object-cover rounded-md shadow-md">
                            <button @click="removeImage(index)" type="button" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none text-xs font-bold">
                                &times;
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Text Inputs with Labels -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-4">
                    <div>
                        <label for="manufacturer" class="block text-gray-700 text-sm font-bold mb-2">Manufacturer</label>
                        <input v-model="tempManufacturer" id="manufacturer" type="text" placeholder="e.g., Good Smile Company" class="form-input">
                    </div>
                    <div>
                        <label for="character" class="block text-gray-700 text-sm font-bold mb-2">Character</label>
                        <input v-model="tempCharacter" id="character" type="text" placeholder="e.g., Hatsune Miku" class="form-input">
                    </div>
                    <div>
                        <label for="series" class="block text-gray-700 text-sm font-bold mb-2">Series</label>
                        <input v-model="tempSeries" id="series" type="text" placeholder="e.g., Vocaloid" class="form-input">
                    </div>
                </div>
                <!-- === NEW: Tag Field === -->
                <div class="mb-4">
                    <label for="categories" class="block text-gray-700 text-sm font-bold mb-2">Categories</label>
                    <TagInput v-model="categoriesArray" placeholder="e.g., Nendoroid, Limited" />
                </div>

                <!-- UPDATED: Tags now uses TagInput -->
                <div class="mb-4">
                    <label for="tags" class="block text-gray-700 text-sm font-bold mb-2">Tags</label>
                    <TagInput v-model="tagsArray" placeholder="e.g., rare, custom paint" />
                </div>

                <!-- Purchase Price & Date -->
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

                <!-- Description -->
                <div class="mb-6">
                    <label for="description" class="block text-gray-700 text-sm font-bold mb-2">My Notes</label>
                    <textarea v-model="form.description" id="description" rows="4" class="form-input" placeholder="Any details like box condition, specific version, etc."></textarea>
                </div>

                <!-- isPrivate Toggle Switch -->
                <div class="mb-6">
                    <label for="isPrivate" class="flex items-center cursor-pointer">
                        <div class="relative">
                            <input type="checkbox" id="isPrivate" class="sr-only peer" v-model="form.isPrivate">
                            <div class="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-green-300 transition-colors"></div>
                            <div class="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-full"></div>
                        </div>
                        <div class="ml-3 text-gray-700 font-medium">
                            Keep this item private
                            <p class="text-sm font-normal text-gray-500">If checked, this item will only be visible to you on your shelf.</p>
                        </div>
                    </label>
                </div>

                <!-- Submit Button -->
                <button type="submit" :disabled="loading" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none transition-colors duration-300 disabled:bg-green-400 disabled:opacity-70 disabled:cursor-not-allowed">
                    <span v-if="loading">Saving...</span>
                    <span v-else>Add to Shelf</span>
                </button>
                <p v-if="errorMessage" class="text-red-500 text-center mt-4">{{ errorMessage }}</p>
            </form>
        </div>
    </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' });
useHead({ title: 'Add New Item | Shelfie' });

const token = useStrapiToken();
const config = useRuntimeConfig();
const router = useRouter();
const currentUser = useStrapiUser();
const strapiUrl = config.public.strapi.url;

const form = reactive({
    name: '',
    itemStatus: 'Owned',
    description: '',
    purchasePrice: null,
    purchaseDate: null,
    files: [],
    isPrivate: false,
});

const imagePreviews = ref([]);
const tempManufacturer = ref('');
const tempCharacter = ref('');
const tempSeries = ref('');
const tempCategories = ref('');
const loading = ref(false);
const errorMessage = ref(null);
const categoriesArray = ref([]);
const tagsArray = ref([]);

let isSubmitting = false;

const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    form.files.push(...newFiles);
    newFiles.forEach(file => {
        imagePreviews.value.push(URL.createObjectURL(file));
    });
};

const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews.value[index]);
    imagePreviews.value.splice(index, 1);
    form.files.splice(index, 1);
};

const findOrCreate = async (endpoint, name) => {
    if (!name?.trim()) return null;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
    };
    const query = new URLSearchParams({ 'filters[name][$eqi]': name.trim() }).toString();
    const { data: existing } = await $fetch(`${strapiUrl}/api/${endpoint}?${query}`, { headers });
    if (existing?.[0]) return existing[0].id;
    const { data: created } = await $fetch(`${strapiUrl}/api/${endpoint}`, {
        method: 'POST',
        headers,
        body: { data: { name: name.trim() } }
    });
    return created?.id;
};

const handleSubmit = async () => {
    if (isSubmitting) {
        console.warn("Submission blocked: a request is already in progress.");
        return;
    }
    isSubmitting = true;
    loading.value = true;
    errorMessage.value = null;

    try {
        let imageIds = [];
        if (form.files.length > 0) {
            const formData = new FormData();
            form.files.forEach(file => formData.append('files', file));
            const uploadedFiles = await $fetch(`${strapiUrl}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token.value}` },
                body: formData,
            });
            imageIds = uploadedFiles.map(file => file.id);
        }

        const manufacturerId = await findOrCreate('manufacturers', tempManufacturer.value);
        const characterId = await findOrCreate('characters', tempCharacter.value);
        const seriesId = await findOrCreate('serieses', tempSeries.value);
        const categoryIds = await Promise.all(
            categoriesArray.value.map(name => findOrCreate('categories', name))
        );
        const tagIds = await Promise.all(
            tagsArray.value.map(name => findOrCreate('tags', name))
        );

        const payload = {
            data: {
                name: form.name,
                user: currentUser.value.id,
                itemStatus: form.itemStatus,
                description: form.description,
                purchasePrice: form.purchasePrice,
                purchaseDate: form.purchaseDate,
                isPrivate: form.isPrivate,
                userImages: imageIds,
                manufacturer: manufacturerId,
                character: characterId,
                series: seriesId,
                categories: categoryIds.filter(id => id),
                tags: tagIds.filter(id => id),
            }
        };

        // --- KEY CHANGE HERE ---
        // We will now call the raw response to inspect it fully.
        const response = await $fetch.raw(`${strapiUrl}/api/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` },
            body: payload,
        });

        const responseData = response._data;
        console.log("Full Strapi Response:", responseData);

        // Explicitly look for `documentId` first, then fall back to `id`.
        const finalDocumentId = responseData.data?.documentId || responseData.data?.id;

        if (!finalDocumentId) {
            throw new Error("Could not find 'documentId' or 'id' in the API response.");
        }

        console.log('✅ SUCCESS: Using Document ID for redirection:', finalDocumentId);
        router.push(`/items/${finalDocumentId}`);

    } catch (e) {
        console.error('❌ ERROR: Submission failed.', e.response?._data || e.data || e);
        errorMessage.value = e.response?._data?.error?.message || e.message || "An error occurred.";
    } finally {
        isSubmitting = false;
        loading.value = false;
    }
};
</script>

<style scoped>
.form-input {
    @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>