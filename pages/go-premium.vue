<template>
    <div class="bg-gray-100">
        <main class="container mx-auto max-w-4xl py-12 px-4 text-center">

            <div class="bg-white rounded-lg shadow-xl p-8">
                <!-- Status/Error Messages remain the same -->
                <div v-if="paymentError" class="mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
                    <p>{{ paymentError }}</p>
                </div>

                <h1 class="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
                    Unlock the Full Power of Shelfie
                </h1>
                <p class="mt-4 text-lg text-gray-600">
                    Become a Premium member to access exclusive features designed for the dedicated collector.
                </p>

                <!-- === NEW: Plan Selection UI === -->
                <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <!-- Monthly Plan Card -->
                    <div @click="selectedPlan = 'monthly'" class="p-6 border-2 rounded-lg cursor-pointer transition-all" :class="selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'">
                        <h3 class="text-xl font-semibold text-gray-800">Monthly</h3>
                        <p class="mt-2 text-4xl font-bold text-gray-900">₱200<span class="text-lg font-medium text-gray-500">/month</span></p>
                        <p class="mt-2 text-sm text-gray-500">Billed monthly.</p>
                    </div>

                    <!-- Annually Plan Card -->
                    <div @click="selectedPlan = 'annually'" class="relative p-6 border-2 rounded-lg cursor-pointer transition-all" :class="selectedPlan === 'annually' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'">
                        <span class="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">SAVE 8%</span>
                        <h3 class="text-xl font-semibold text-gray-800">Annually</h3>
                        <p class="mt-2 text-4xl font-bold text-gray-900">₱2,208<span class="text-lg font-medium text-gray-500">/year</span></p>
                        <p class="mt-2 text-sm text-gray-500">Billed once per year.</p>
                    </div>
                </div>

                <!-- Feature Grid (remains the same) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 text-left">
                    <!-- Features... -->
                </div>

                <!-- Call to Action Button (updated) -->
                <div class="mt-12">
                    <button @click="handleGoPremium" :disabled="isLoading" class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-full text-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-wait">
                        <span v-if="isLoading">Processing...</span>
                        <span v-else>
                            {{ selectedPlan === 'monthly' ? 'Go Premium for ₱200' : 'Go Premium for ₱2,208' }}
                        </span>
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref } from 'vue';

useHead({ title: 'Go Premium | Shelfie' });
definePageMeta({ middleware: 'auth' });

const isLoading = ref(false);
const paymentError = ref(null);
const paymentStatus = ref(null);
const route = useRoute();
// We use useStrapiUser for consistency, assuming its reactivity is reliable
const user = useStrapiUser();
const selectedPlan = ref('monthly'); // 'monthly' or 'annually'

onMounted(() => {
    if (route.query.status === 'success') {
        paymentStatus.value = 'success';
        // TODO: Here you would call another secure server route to finalize the payment 
        // and update the user's subscription in Strapi, potentially using the
        // checkoutSessionId stored in sessionStorage.
    } else if (route.query.status === 'cancelled') {
        paymentStatus.value = 'cancelled';
    }
    // Clean up session storage after reading/processing
    sessionStorage.removeItem('paymongo_checkout_session_id');
});

const handleGoPremium = async () => {
    isLoading.value = true;
    paymentError.value = null;

    if (!user.value) {
        paymentError.value = 'You must be logged in to proceed.';
        isLoading.value = false;
        return;
    }

    try {
        // --- UPDATED: Send the selected plan to the BFF endpoint ---
        const response = await $fetch('/api/paymongo/create-checkout', {
            method: 'POST',
            body: {
                plan: selectedPlan.value,
                user: user.value
            }
        });
        // --------------------------------------------------------

        if (response.checkoutUrl && response.checkoutSessionId) {
            // Store the session ID BEFORE redirecting
            sessionStorage.setItem('paymongo_checkout_session_id', response.checkoutSessionId);

            // Redirect the user
            window.location.href = response.checkoutUrl;
        } else {
            throw new Error("Could not retrieve a valid checkout URL and Session ID.");
        }

    } catch (e) {
        console.error("Payment initiation failed:", e);
        // Handle server-side errors returned by the Nitro route
        paymentError.value = e.data?.statusMessage || e.message || "An unexpected error occurred. Please try again.";
        isLoading.value = false;
    }
};
</script>