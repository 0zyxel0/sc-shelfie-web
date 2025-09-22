<template>
    <div>
        <main class="container mx-auto py-8 px-4 max-w-3xl">
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-gray-800">News Feed</h1>
                <p class="mt-1 text-lg text-gray-600">See the latest additions from users you follow.</p>
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="text-center text-gray-500 py-10">
                <p>Loading your feed...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center bg-white p-10 rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold text-red-700">Could not load your feed</h3>
                <p class="text-gray-500 mt-2">{{ error.data?.statusMessage || "Please try again later." }}</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!items || items.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold text-gray-800">Your feed is empty</h3>
                <p class="text-gray-500 mt-2">Follow some users to see their new items here, or add your own!</p>
                <div class="mt-4">
                    <!-- This link might be better pointing to a user discovery/search page -->
                    <NuxtLink to="/my-shelf" class="text-blue-600 font-semibold hover:underline">View Your Shelf</NuxtLink>
                </div>
            </div>

            <!-- Feed Items -->
            <div v-else class="space-y-8">
                <!-- Use a separate FeedItemCard component for better structure -->
                <FeedItemCard v-for="item in items" :key="item.documentId" :item="item" />
            </div>
        </main>
    </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' });
useHead({ title: 'News Feed | Shelfie' });

const { user: currentUser } = useAuthUser();

// --- Simplified Data Fetch ---
// A single call to our BFF endpoint handles all the complex logic.
const { data: items, pending, error } = await useAsyncData(
    `feed-${currentUser.value?.id}`, // The key is still dependent on the user ID
    () => {
        // Only fetch if a user is logged in.
        if (!currentUser.value?.id) {
            return Promise.resolve([]); // Return an empty array immediately if not logged in
        }
        return $fetch('/api/feed');
    },
    {
        watch: [() => currentUser.value?.id] // Re-fetch if the user changes
    }
);

// Note: The `FeedItemCard` component would need to be created in `/components/FeedItemCard.vue`
// It would be similar to `ItemCard` but styled for a feed layout (e.g., wider, showing user info prominently).
</script>