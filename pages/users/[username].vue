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
                            <div class="mt-2 flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-600">
                                <div>
                                    <span class="font-bold text-gray-800">{{ user.following.length }}</span> Following
                                </div>
                                <div>
                                    <span class="font-bold text-gray-800">{{ user.followers.length }}</span> Followers
                                </div>
                            </div>
                            <div v-if="currentUser && currentUser.documentId !== user.documentId" class="mt-4 sm:mt-0">
                                <button @click="toggleFollow" :disabled="followPending" class="w-full sm:w-auto font-bold py-2 px-6 rounded-full transition-colors duration-200 disabled:opacity-50" :class="isFollowing ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'">
                                    <span v-if="followPending">...</span>
                                    <span v-else>{{ isFollowing ? 'Following' : 'Follow' }}</span>
                                </button>
                            </div>
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
                    <ItemCard v-for="item in userItems" :key="item.documentId" :item="item" />
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
const currentUser = useStrapiUser();
const token = useStrapiToken();

useHead({ title: () => `@${username}'s Profile | Shelfie` });

// --- Fetch both user and their public items in parallel ---
const { data, pending, error, refresh } = await useAsyncData(
    `public-profile-${username}`,
    async () => {
        const loggedInUserId = currentUser.value?.id;
        // 1. Fetch the user's public profile data (username, displayName, avatar, etc.)
        const userQuery = qs.stringify({
            populate: ['profilePicture', 'followers', 'following']
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

        const followingPromise = loggedInUserId
            ? $fetch(`${config.public.strapi.url}/api/users/${loggedInUserId}?populate=following`)
            : Promise.resolve(null); // Resolve to null if no one is logged in

        // Wait for both API calls to complete
        const [userResponse, itemsResponse, followingResponse] = await Promise.all([userPromise, itemsPromise, followingPromise]);

        // If the userPromise returns an empty array, the user doesn't exist.
        if (!userResponse || userResponse.length === 0) {
            // Throwing an error here will set the `error` state for our template.
            throw new Error('User not found');
        }

        return {
            user: userResponse[0], // The user whose profile is being viewed
            items: (itemsResponse.data || []).map(item => ({ id: item.documentId, ...item })), // Their items
            currentUserFollowing: followingResponse?.following || [] // The logged-in user's following list
        };
    }
);

// --- Computed properties to safely access the fetched data ---
const followPending = ref(false);

const user = computed(() => data.value?.user);
const userItems = computed(() => data.value?.items);

const isFollowing = computed(() => {
    if (!user.value || !data.value?.currentUserFollowing) return false;
    return data.value.currentUserFollowing.some(followedUser => followedUser.id === user.value.id);
});

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

// --- THE NEW, SIMPLIFIED toggleFollow FUNCTION ---
const toggleFollow = async () => {
    if (!currentUser.value || !user.value) return;
    followPending.value = true;

    try {
        let endpoint = '';

        if (isFollowing.value) {
            // UNFOLLOW
            endpoint = `${config.public.strapi.url}/api/users/${user.value.id}/unfollow`;
        } else {
            // FOLLOW
            endpoint = `${config.public.strapi.url}/api/users/${user.value.id}/follow`;
        }

        // Call our new custom endpoint. The body is now empty!
        await $fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token.value}` }
        });

        // We still refresh to get the latest follower count and button state.
        refresh();
    } catch (e) {
        console.error("Failed to toggle follow:", e);
    } finally {
        followPending.value = false;
    }
};
</script>