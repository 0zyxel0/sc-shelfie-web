<template>
    <div class="bg-gray-100 min-h-screen flex items-center justify-center">
        <main class="container mx-auto max-w-lg py-12 px-4 text-center">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <!-- States: Verifying, Success, Error -->
                <div v-if="verificationStatus === 'pending'">
                    <h1 class="text-3xl font-bold text-gray-800">Verifying Your Payment...</h1>
                    <p class="mt-4 text-gray-600">Please wait while we confirm your transaction. Do not close this page.</p>
                </div>
                <div v-else-if="verificationStatus === 'success'">
                    <div class="text-green-500 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800">Welcome to Premium!</h1>
                    <p class="mt-4 text-gray-600">
                        Thank you for your support! Your account has been upgraded. You now have access to all premium features.
                    </p>
                    <NuxtLink to="/my-shelf" class="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                        Go to My Shelf
                    </NuxtLink>
                </div>
                <div v-else-if="verificationStatus === 'error'">
                    <div class="text-red-500 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800">Verification Failed</h1>
                    <p class="mt-4 text-gray-600">
                        {{ errorMessage || "We couldn't confirm your payment. Please contact support if you believe this is an error." }}
                    </p>
                    <NuxtLink to="/go-premium" class="mt-8 inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                        Try Again
                    </NuxtLink>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

useHead({ title: 'Payment Success | Shelfie' });

const router = useRouter();
const user = useStrapiUser();
const { fetchUser: refreshUser } = useStrapiAuth(); // Correct way to get the refresh function for the user
const { create } = useStrapi(); // Import 'create' instead of 'update'
const verificationStatus = ref('pending');
const errorMessage = ref('');

onMounted(async () => {
    const sessionId = sessionStorage.getItem('paymongo_checkout_session_id');

    // Clean up immediately
    sessionStorage.removeItem('paymongo_checkout_session_id');

    // 1. Ensure user is loaded
    if (!user.value) {
        // Attempting to refresh the user state if it's not present
        await refreshUser();
    }
    if (!user.value) {
        errorMessage.value = "You must be logged in to verify a payment.";
        verificationStatus.value = 'error';
        setTimeout(() => router.push('/auth'), 5000);
        return;
    }
    if (!sessionId) {
        errorMessage.value = "Could not find a payment session to verify.";
        verificationStatus.value = 'error';
        return;
    }

    try {
        // 2. Server-Side Verification
        // This remains the same, but we expect more data in the response
        const result = await $fetch('/api/paymongo/verify-payment', {
            method: 'POST',
            body: { checkoutSessionId: sessionId }
        });

        if (!result.success || !result.plan) {
            throw new Error(result.message || "Payment could not be confirmed by the server.");
        }

        // --- NEW LOGIC: Create a Subscription Entry ---

        // Helper function to calculate the expiration date
        const calculateExpiryDate = (plan) => {
            const date = new Date();
            if (plan === 'annually') {
                date.setFullYear(date.getFullYear() + 1);
            } else {
                // Default to monthly
                date.setMonth(date.getMonth() + 1);
            }
            return date.toISOString();
        };

        // Prepare the data payload for the 'subscriptions' collection
        const subscriptionPayload = {
            // Strapi v4/v5 requires payloads to be wrapped in a 'data' object
            user: user.value.id,
            plan: result.plan,
            subscriptionStatus: 'active',
            expiresAt: calculateExpiryDate(result.plan),
            providerSubscriptionId: result.providerSubscriptionId,
            lastCheckoutSessionId: sessionId,

        };

        // Create the new subscription record in Strapi
        await create('subscriptions', subscriptionPayload);

        // --- END OF NEW LOGIC ---

        // 3. Success: Refresh user state. If you populated 'subscriptions' on the user model,
        // this will fetch the new subscription details.
        await refreshUser();

        verificationStatus.value = 'success';

    } catch (e) {
        console.error("Payment verification failed:", e);
        errorMessage.value = e.data?.statusMessage || e.message || "An error occurred during verification.";
        verificationStatus.value = 'error';
    }
});
</script>