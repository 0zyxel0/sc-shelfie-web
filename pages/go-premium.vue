// /pages/go-premium.vue (Full, Corrected Code)

<template>
    <div class="bg-gray-100">
        <main class="container mx-auto max-w-4xl py-12 px-4 text-center">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <!-- Status Messages -->
                <div v-if="paymentStatus === 'success'" class="mb-8 p-4 bg-green-100 text-green-800 rounded-lg">
                    <h3 class="font-bold">Payment Successful!</h3>
                    <p>Thank you for your support! Your account has been upgraded to Premium.</p>
                </div>
                <div v-if="paymentStatus === 'cancelled'" class="mb-8 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                    <p>Your payment was cancelled. You can try again anytime.</p>
                </div>
                <div v-if="paymentError" class="mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
                    <p>{{ paymentError }}</p>
                </div>

                <h1 class="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
                    Unlock the Full Power of Shelfie
                </h1>
                <p class="mt-4 text-lg text-gray-600">
                    Become a Premium member to access exclusive features designed for the dedicated collector.
                </p>

                <!-- Feature Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 text-left">
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Export Your Collection</h3>
                            <p class="mt-1 text-gray-500">
                                Download your entire collection data as a CSV or a beautifully formatted PDF.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Call to Action -->
                <div class="mt-12">
                    <button @click="handleGoPremium" :disabled="isLoading" class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-full text-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-wait">
                        <span v-if="isLoading">Processing...</span>
                        <span v-else>Go Premium Now for ₱200.00</span>
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

useHead({ title: 'Go Premium | Shelfie' });
definePageMeta({ middleware: 'auth' });

const isLoading = ref(false);
const paymentError = ref(null);
const paymentStatus = ref(null);
const route = useRoute();
const { user } = useAuthUser();

onMounted(() => {
    // This part remains the same, but it's now less relevant as we don't get query params.
    // It's good to keep in case you ever want to link directly to this page with a message.
    if (route.query.status === 'success') {
        paymentStatus.value = 'success';
    } else if (route.query.status === 'cancelled') {
        paymentStatus.value = 'cancelled';
    }
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
        const response = await $fetch('/api/paymongo/create-checkout', {
            method: 'POST',
        });

        if (response.checkoutUrl && response.checkoutSessionId) {
            // --- FIX: Store the session ID in sessionStorage BEFORE redirecting ---
            sessionStorage.setItem('paymongo_checkout_session_id', response.checkoutSessionId);

            // Now, redirect the user
            window.location.href = response.checkoutUrl;
        } else {
            throw new Error("Could not retrieve a valid checkout URL and Session ID.");
        }

    } catch (e) {
        console.error("Payment initiation failed:", e);
        paymentError.value = e.data?.statusMessage || "An unexpected error occurred. Please try again.";
        isLoading.value = false;
    }
};
</script>