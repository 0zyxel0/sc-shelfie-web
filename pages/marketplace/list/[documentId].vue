<template>
    <div class="max-w-2xl mx-auto py-12 px-4">
        <div v-if="pending">Loading...</div>
        <div v-else-if="error || !item">Failed to load item for listing.</div>
        <div v-else class="bg-white p-8 rounded-lg shadow-md border">
            <h1 class="text-3xl font-bold mb-2">List Your Item for Sale</h1>
            <p class="text-gray-600 mb-6">You're listing: <span class="font-semibold">{{ item.name }}</span></p>

            <form @submit.prevent="handleListForSale" class="space-y-6">
                <div>
                    <label for="price" class="block text-sm font-medium text-gray-700">Listing Price (USD)</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input type="number" step="0.01" id="price" v-model.number="formData.listingPrice" class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00">
                    </div>
                </div>

                <div>
                    <label for="condition" class="block text-sm font-medium text-gray-700">Condition</label>
                    <select id="condition" v-model="formData.itemCondition" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option>New</option>
                        <option>Like New</option>
                        <option>Used - Good</option>
                        <option>Used - Fair</option>
                    </select>
                </div>

                <div>
                    <label for="shipping" class="pa-1block text-sm font-medium text-gray-700">Shipping Details</label>
                    <textarea id="shipping" rows="4" v-model="formData.shippingDetails" class="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md pa-1" placeholder="e.g., Ships from California, USA. Buyer pays shipping."></textarea>
                </div>
                <div>
                    <label for="contact" class="block text-sm font-medium text-gray-700">Contact & Message Instructions</label>
                    <textarea id="contact" rows="4" v-model="formData.sellerContactInfo" class="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md pa-1" placeholder="e.g., Please message me here on Shelfie to purchase, or email me at example@email.com."></textarea>
                    <p class="mt-2 text-xs text-gray-500">Provide clear instructions on how potential buyers should contact you.</p>
                </div>

                <div class="pt-4">
                    <button type="submit" :disabled="isSubmitting" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
                        {{ isSubmitting ? 'Submitting...' : 'List Item on Marketplace' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
const { findOne, update } = useStrapi();
const route = useRoute();
const router = useRouter();
const docId = route.params.documentId;

const formData = reactive({
    listingPrice: null,
    itemCondition: 'New',
    shippingDetails: '',
    sellerContactInfo: '',
});

const isSubmitting = ref(false);

// Fetch item data to pre-fill the form if it's an existing listing
const { data: item, pending, error } = await useAsyncData(`item-listing-${docId}`, async () => {
    const response = await findOne('items', docId);
    return response.data;
});

// Pre-fill form if data exists
if (item.value) {
    formData.listingPrice = item.value.listingPrice;
    formData.itemCondition = item.value.itemCondition || 'New';
    formData.shippingDetails = item.value.shippingDetails || '';
    formData.sellerContactInfo = item.value.sellerContactInfo || '';
}

const handleListForSale = async () => {
    if (!formData.listingPrice || formData.listingPrice <= 0) {
        alert('Please enter a valid price.');
        return;
    }

    isSubmitting.value = true;
    try {
        await update('items', docId, {
            ...formData,
            isForSale: true,
            listingStatus: 'Available',
        });
        // Success! Redirect back to the item page.
        router.push(`/items/${docId}`);
    } catch (e) {
        console.error('Failed to list item:', e);
        alert('There was an error listing your item.');
    } finally {
        isSubmitting.value = false;
    }
}

</script>