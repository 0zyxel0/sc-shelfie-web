<template>
    <div>
        <main class="container mx-auto py-8 px-4">

            <!-- Loading State -->
            <div v-if="pending" class="text-center py-20 text-gray-500">
                <p>Loading @{{ username }}'s profile...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error || !user" class="text-center py-20 bg-white rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold text-red-600">User Not Found</h2>
                <p class="text-gray-600 mt-2">The profile for @{{ username }} could not be found.</p>
                <NuxtLink to="/" class="mt-6 inline-block text-blue-600 hover:underline">
                    Return to Showcase
                </NuxtLink>
            </div>

            <!-- Profile Display -->
            <div v-else>
                <!-- Profile Header Card -->
                <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <div class="flex flex-col sm:flex-row items-center">
                        <!-- Profile Picture -->
                        <div class="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                            <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100" :src="profilePictureUrl" :alt="`${user.username}'s profile picture`">
                        </div>
                        <!-- User Info -->
                        <div class="flex-1 text-center sm:text-left">
                            <h1 class="text-3xl font-bold text-gray-800">{{ user.displayName || user.username }}</h1>
                            <p class="text-md text-gray-500">@{{ user.username }}</p>
                            <p class="text-sm text-gray-400 mt-1">Member since {{ memberSince }}</p>
                        </div>
                    </div>
                </div>

                <!-- Public Items Grid -->
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Public Collection</h2>

                <!-- Empty State for Items -->
                <div v-if="!userItems || userItems.length === 0" class="bg-white text-center p-8 rounded-lg shadow-md">
                    <p class="text-gray-600">@{{ username }} hasn't shared any public items yet.</p>
                </div>

                <!-- Grid of Items -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <ItemCard v-for="item in userItems" :key="item.id" :item="item" />
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import qs from 'qs';

const route = useRoute();
const config = useRuntimeConfig();
const username = route.params.username;

useHead({ title: () => `@${username}'s Profile | Shelfie` });

// --- Fetch both user and their public items in parallel ---
const { data, pending, error } = await useAsyncData(
    `public-profile-${username}`,
    async () => {
        // 1. Fetch the user's public profile data (username, displayName, avatar, etc.)
        const userQuery = qs.stringify({
            populate: 'profilePicture'
        });
        const userPromise = $fetch(`${config.public.strapi.url}/api/users?filters[username][$eq]=${username}&${userQuery}`);

        // 2. Fetch the user's public items
        const itemsQuery = qs.stringify({
            filters: {
                user: { username: { $eq: username } },
                isPrivate: { $eq: false } // Only fetch public items
            },
            populate: {
                userImages: { fields: ['url'] },
                user: { fields: ['username'] } // Populate user for the ItemCard
            },
            sort: 'createdAt:desc'
        });
        const itemsPromise = $fetch(`${config.public.strapi.url}/api/items?${itemsQuery}`);

        // Wait for both API calls to complete
        const [userResponse, itemsResponse] = await Promise.all([userPromise, itemsPromise]);

        // If the userPromise returns an empty array, the user doesn't exist.
        if (!userResponse || userResponse.length === 0) {
            // Throwing an error here will set the `error` state for our template.
            throw new Error('User not found');
        }

        return {
            user: userResponse[0], // The user object
            items: (itemsResponse.data || []).map(item => ({ id: item.id, ...item })) // The transformed item array
        };
    }
);

// --- Computed properties to safely access the fetched data ---
const user = computed(() => data.value?.user);
const userItems = computed(() => data.value?.items);

const profilePictureUrl = computed(() => {
    if (user.value?.profilePicture?.url) {
        return config.public.strapi.url + user.value.profilePicture.url;
    }
    return '/avatar-placeholder.png'; // Fallback avatar
});

const memberSince = computed(() => {
    if (user.value?.createdAt) {
        return new Date(user.value.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
        });
    }
    return '';
});
</script>