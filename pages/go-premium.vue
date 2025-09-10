<template>
    <div class="bg-gray-100">
        <main class="container mx-auto max-w-4xl py-12 px-4 text-center">

            <div class="bg-white rounded-lg shadow-xl p-8">
                <h1 class="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
                    Unlock the Full Power of Shelfie
                </h1>
                <p class="mt-4 text-lg text-gray-600">
                    Become a Premium member to access exclusive features designed for the dedicated collector.
                </p>

                <!-- Feature Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 text-left">

                    <!-- Feature 1: Export Collection -->
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Export Your Collection</h3>
                            <p class="mt-1 text-gray-500">
                                Download your entire collection data as a CSV for spreadsheets or a beautifully formatted PDF for sharing and record-keeping.
                            </p>
                        </div>
                    </div>

                    <!-- Feature 2: Advanced Statistics (Future) -->
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Advanced Collection Statistics</h3>
                            <p class="mt-1 text-gray-500">
                                Get deeper insights into your collection with detailed charts and analytics on your spending habits, most valuable items, and more.
                            </p>
                        </div>
                    </div>

                    <!-- Feature 3: Ad-Free Experience (Future) -->
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Ad-Free Browsing</h3>
                            <p class="mt-1 text-gray-500">
                                Enjoy an uninterrupted experience across the entire site by removing all advertisements.
                            </p>
                        </div>
                    </div>

                    <!-- Feature 4: Premium Profile Badge (Future) -->
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-blue-100 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">Premium Profile Badge</h3>
                            <p class="mt-1 text-gray-500">
                                Show your support for the community with a special badge on your profile page.
                            </p>
                        </div>
                    </div>

                </div>

                <!-- Call to Action -->
                <div class="mt-12">
                    <!-- This would eventually link to a payment page like Stripe Checkout -->
                    <button class="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-full text-xl transition-all shadow-lg">
                        Go Premium Now
                    </button>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
useHead({ title: 'Go Premium | Shelfie' });
</script>