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
                    <TagInput v-model="form.tags" placeholder="e.g., rare, custom paint" />
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

const form = reactive({
    name: '',
    itemStatus: 'Owned',
    description: '',
    purchasePrice: null,
    purchaseDate: null,
    files: [], // To hold the actual file objects
    isPrivate: false,
    manufacturer: '',
    character: '',
    series: '',
    categories: [], // Now directly part of the form
    tags: [],       // Now directly part of the form
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
    imagePreviews.value.splice(index, 1);
    form.files.splice(index, 1);
};

const handleSubmit = async () => {
    loading.value = true;
    errorMessage.value = null;

    try {
        // Use FormData to send both files and text data
        const formData = new FormData();

        // Append all text fields
        formData.append('name', form.name);
        formData.append('itemStatus', form.itemStatus);
        formData.append('description', form.description || '');
        if (form.purchasePrice !== null) formData.append('purchasePrice', form.purchasePrice);
        if (form.purchaseDate) formData.append('purchaseDate', form.purchaseDate);
        formData.append('isPrivate', form.isPrivate);
        formData.append('manufacturer', form.manufacturer || '');
        formData.append('character', form.character || '');
        formData.append('series', form.series || '');
        // Join arrays into comma-separated strings for the server
        formData.append('categories', form.categories.join(','));
        formData.append('tags', form.tags.join(','));

        // Append all file objects
        form.files.forEach((file, index) => {
            formData.append(`file_${index}`, file); // Give each file a unique name
        });

        // Make a single call to our BFF orchestration endpoint
        const createdItem = await $fetch('/api/items/create', {
            method: 'POST',
            body: formData, // $fetch handles multipart/form-data encoding
        });

        // The BFF endpoint returns the new item's ID
        if (createdItem.id) {
            router.push(`/items/${createdItem.documentId || createdItem.id}`);
        } else {
            throw new Error("Could not find item ID in the API response.");
        }

    } catch (e) {
        console.error('❌ ERROR: Submission failed.', e.data || e);
        errorMessage.value = e.data?.statusMessage || e.message || "An error occurred.";
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.form-input {
    @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>