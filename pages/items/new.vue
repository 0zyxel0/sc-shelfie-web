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

                <!-- Status -->
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
                    <label for="tags" class="block text-gray-700 text-sm font-bold mb-2">Tags</label>
                    <TagInput v-model="form.itags" placeholder="e.g., rare, custom paint" />
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
import { reactive, ref } from 'vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Add New Item | Shelfie' });

const router = useRouter();
const { find } = useStrapi();
const client = useStrapiClient();
const user = useStrapiUser();

// --- UTILITY FUNCTIONS (Unchanged) ---
const findOrCreateRelation = async (entityType, name) => {
    if (!name) return null;
    const cleanName = name.trim();

    const existing = await find(entityType, {
        filters: { name: { $eqi: cleanName } },
        pagination: { limit: 1 }
    });

    console.log(`🔍 Checking for existing ${entityType} with name "${cleanName}":`, existing);

    if (existing?.data?.length > 0) {
        return existing.data[0].documentId;
    }

    const newEntity = await client(`${entityType}`, {
        method: 'POST',
        body: { data: { name: cleanName } }
    });

    console.log(`➕ Created new ${entityType} with name "${cleanName}":`, newEntity);

    return newEntity?.data?.documentId;
};


// --- FORM STATE, FILE HANDLERS (Unchanged) ---
const form = reactive({
    name: '',
    itemStatus: 'Owned',
    description: '',
    purchasePrice: null,
    purchaseDate: null,
    files: [], // Crucial: This field exists on the reactive form state
    isPrivate: false,
    manufacturer: '',
    character: '',
    series: '',
    categories: [],
    itags: [],
});

const imagePreviews = ref([]);
const loading = ref(false);
const errorMessage = ref(null);

const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    form.files.push(...newFiles);
    newFiles.forEach(file => {
        imagePreviews.value.push(URL.createObjectURL(file));
    });
};

const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews.value[index]);
    form.files.splice(index, 1);
    imagePreviews.value.splice(index, 1);
};


// --- SUBMISSION LOGIC (Applied Fix: Clean Payload) ---

const handleSubmit = async () => {
    loading.value = true;
    errorMessage.value = null;

    try {
        if (!user.value?.id) {
            throw new Error("User authentication failed.");
        }

        let imageIds = [];
        if (form.files.length > 0) {
            const strapiUploadFormData = new FormData();
            form.files.forEach((file) => {
                strapiUploadFormData.append("files", file
                );
            });

            const uploadedFiles = await client(`/upload`, {
                method: "POST",
                body: strapiUploadFormData,
            });
            imageIds = uploadedFiles.map((file) => file.id);
        }

        // 1. FIND/CREATE RELATIONS
        const [
            manufacturerId,
            characterId,
            seriesId,
            categoryIds,
            tagIds
        ] = await Promise.all([
            findOrCreateRelation('manufacturers', form.manufacturer),
            findOrCreateRelation('characters', form.character),
            findOrCreateRelation('serieses', form.series),
            Promise.all(form.categories.map(c => findOrCreateRelation('categories', c))),
            Promise.all(form.itags.map(t => findOrCreateRelation('itags', t)))
        ]);

        // 2. CONSTRUCT CLEAN ITEM PAYLOAD (JSON part)
        // We MUST explicitly pick attributes and relations and avoid spreading 'form'
        // to prevent reactive properties (like the `files` array) from leaking into the JSON payload.
        const itemPayload = {
            data: {
                name: form.name,
                itemStatus: form.itemStatus,
                description: form.description,
                purchasePrice: form.purchasePrice,
                purchaseDate: form.purchaseDate,
                isPrivate: form.isPrivate,
                userImages: imageIds,
                user: user.value.id,
                manufacturer: manufacturerId,
                character: characterId,
                series: seriesId,
                categories: categoryIds.filter(Boolean),
                itags: tagIds.filter(Boolean),
            }
            // IMPORTANT: The `files` property that existed on the reactive 'form' state is explicitly excluded here.
        };

        // 4. EXECUTE COMBINED CREATE REQUEST
        const createdItemResponse = await client(`items`, {
            method: 'POST',
            body: itemPayload,
        });
        console.log('✅ SUCCESS: Item created:', createdItemResponse);
        const createdItemId = createdItemResponse?.data?.documentId;

        if (createdItemId) {
            router.push(`/items/${createdItemId}`);
        } else {
            throw new Error("Strapi item creation failed or returned no ID.");
        }

    } catch (e) {
        // Logging the error structure is key for further debugging
        console.error('❌ ERROR: Submission failed.', e.response?.data || e);
        const apiError = e.response?.data?.error?.message || e.message;
        errorMessage.value = `Submission failed: ${apiError}`;
    } finally {
        loading.value = false;
        imagePreviews.value.forEach(url => URL.revokeObjectURL(url));
    }
};
</script>

<style scoped>
.form-input {
    @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>