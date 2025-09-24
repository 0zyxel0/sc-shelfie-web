<template>
    <div class="bg-gray-100 min-h-screen flex items-center justify-center">
        <main class="container mx-auto max-w-lg py-12 px-4 text-center">

            <div class="bg-white rounded-lg shadow-xl p-8">
                <h1 class="text-3xl font-bold text-gray-800">Payment Cancelled</h1>
                <p class="mt-4 text-gray-600">
                    Your payment process was cancelled. You have not been charged. You can return to the premium page to try again.
                </p>
                <NuxtLink to="/go-premium" class="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                    Back to Premium Page
                </NuxtLink>
            </div>

        </main>
    </div>
</template>

<script setup>
useHead({ title: 'Payment Cancelled | Shelfie' });
</script>