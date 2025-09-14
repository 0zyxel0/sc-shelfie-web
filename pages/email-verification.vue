<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">

            <!-- Loading State -->
            <div v-if="pending">
                <h1 class="text-2xl font-bold text-gray-800">Verifying Your Email...</h1>
                <p class="text-gray-500 mt-2">Please wait a moment.</p>
            </div>

            <!-- Success State -->
            <div v-else-if="success">
                <h1 class="text-2xl font-bold text-green-600">Verification Successful!</h1>
                <p class="text-gray-600 mt-2">Your email has been verified. You can now log in to your account.</p>
                <NuxtLink to="/auth" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Go to Login
                </NuxtLink>
            </div>

            <!-- Error State -->
            <div v-else>
                <h1 class="text-2xl font-bold text-red-600">Verification Failed</h1>
                <p class="text-gray-600 mt-2">{{ errorMessage }}</p>
                <NuxtLink to="/" class="mt-6 inline-block text-blue-600 hover:underline">
                    Return to Homepage
                </NuxtLink>
            </div>

        </div>
    </div>
</template>

<script setup>
definePageMeta({ layout: false });
useHead({ title: 'Email Verification | Shelfie' });

const route = useRoute();
const config = useRuntimeConfig();

const pending = ref(true);
const success = ref(false);
const errorMessage = ref('An unknown error occurred. The link may be invalid or expired.');

onMounted(async () => {
    const confirmationToken = route.query.confirmation;

    // Check if the confirmation token exists in the URL
    if (!confirmationToken) {
        errorMessage.value = 'No confirmation token found. Please check the link in your email.';
        pending.value = false;
        return;
    }

    try {
        // This is the specific Strapi endpoint for email confirmation
        await $fetch(`${config.public.strapi.url}/api/auth/email-confirmation`, {
            method: 'GET',
            params: {
                confirmation: confirmationToken,
            },
        });

        // If the request succeeds, update the state
        success.value = true;

    } catch (e) {
        // If the request fails, Strapi sends back a specific error message
        errorMessage.value = e.response?._data?.error?.message || 'The confirmation link is invalid or has expired.';
        console.error('Email verification error:', e.response);
    } finally {
        pending.value = false;
    }
});
</script>