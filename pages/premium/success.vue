<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <main class="container mx-auto max-w-lg py-12 px-4 text-center">
            <div class="bg-white rounded-lg shadow-xl p-8">

                <!-- Verifying State -->
                <div v-if="isVerifying">
                    <div class="text-blue-500 mb-4">
                        <!-- Loading Spinner -->
                        <svg class="animate-spin h-16 w-16 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800">Verifying Your Payment...</h1>
                    <p class="mt-2 text-gray-600">Please wait while we confirm your transaction.</p>
                </div>

                <!-- Success State -->
                <div v-if="verificationSuccess">
                    <div class="text-green-500 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800">Payment Successful!</h1>
                    <p class="mt-4 text-gray-600">Welcome to Premium! Your account has been upgraded.</p>
                    <div class="mt-8">
                        <NuxtLink to="/my-shelf" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all">
                            Go to My Collection
                        </NuxtLink>
                    </div>
                </div>

                <!-- Error State -->
                <div v-if="verificationError">
                    <div class="text-red-500 mb-4">
                        <svg class="w-16 h-16 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800">Verification Failed</h1>
                    <p class="mt-4 text-gray-600">{{ verificationError }}</p>
                    <p class="mt-2 text-sm text-gray-500">If you believe you were charged, please contact support.</p>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

useHead({ title: 'Verifying Payment | Shelfie' });
definePageMeta({ middleware: 'auth' });

const client = useStrapiClient();
const isVerifying = ref(true);
const verificationSuccess = ref(false);
const verificationError = ref(null);

onMounted(async () => {
    // 1. Retrieve the session ID from storage
    const checkoutSessionId = sessionStorage.getItem('paymongo_checkout_session_id');

    // 2. Clean up immediately to prevent re-use
    sessionStorage.removeItem('paymongo_checkout_session_id');

    if (!checkoutSessionId) {
        verificationError.value = "Could not find a payment session to verify. If you just paid, please contact support.";
        isVerifying.value = false;
        return;
    }

    try {
        // 3. Call the Strapi backend to verify the payment
        const response = await client('/paymongo/verify-payment', {
            method: 'POST',
            body: { checkoutSessionId },
        });

        if (response.success) {
            verificationSuccess.value = true;
            router.push('/my-shelf'); // Refresh to update premium status
        } else {
            throw new Error(response.message || 'Verification was not successful.');
        }

    } catch (e) {
        console.error("Verification failed:", e);
        verificationError.value = e.data?.error?.message || e.message || "An unknown error occurred during verification.";
    } finally {
        isVerifying.value = false;
    }
});
</script>