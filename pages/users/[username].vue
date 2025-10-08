<template>
    <div class="bg-gray-100 min-h-screen">
        <!-- Loading State -->
        <div v-if="pending" class="text-center py-20 text-gray-500">
            Loading profile for @{{ username }}...
        </div>

        <!-- Error State -->
        <div v-else-if="error || !profileData" class="text-center py-20">
            <h2 class="text-xl font-semibold text-red-600">User Not Found</h2>
            <p class="text-gray-500">The user @{{ username }} could not be found.</p>
            <NuxtLink to="/" class="mt-4 inline-block text-blue-600 hover:underline">Go back home</NuxtLink>
        </div>

        <!-- Main Content -->
        <main v-else class="container mx-auto py-8 px-4">

            <!-- Profile Header Card -->
            <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
                <div class="flex flex-col sm:flex-row items-center">
                    <!-- Profile Picture -->
                    <div class="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                        <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100" :src="profilePictureUrl" :alt="`${profileData.username}'s profile picture`">
                    </div>

                    <!-- User Info -->
                    <div class="flex-1 text-center sm:text-left">
                        <h1 class="text-3xl font-bold text-gray-800">{{ profileData.displayName || profileData.username }}</h1>
                        <p class="text-md text-gray-500">@{{ profileData.username }}</p>
                        <p class="text-sm text-gray-400 mt-1">Member since {{ memberSince }}</p>

                        <div class="mt-2 flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-600">
                            <span>
                                <span class="font-bold text-gray-800">{{ profileData.followingCount }}</span> Following
                            </span>
                            <span>
                                <span class="font-bold text-gray-800">{{ followersCount }}</span> Followers
                            </span>
                        </div>
                    </div>

                    <!-- Action Buttons (Follow/Unfollow) -->
                    <div v-if="currentUser?.id && currentUser.id !== profileData.id" class="flex space-x-2 mt-4 sm:mt-0">
                        <button @click="handleFollowToggle" :disabled="followPending" class="font-semibold py-2 px-6 rounded-lg transition-colors text-sm w-32" :class="{
                            'bg-blue-600 hover:bg-blue-700 text-white': !isFollowing,
                            'bg-gray-200 hover:bg-gray-300 text-gray-800': isFollowing,
                            'opacity-50 cursor-not-allowed': followPending
                        }">
                            <span v-if="followPending">...</span>
                            <span v-else>{{ isFollowing ? 'Unfollow' : 'Follow' }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- User's Public Collection -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Public Collection</h2>

                <div v-if="items.length === 0" class="bg-white text-center p-8 rounded-lg shadow-md">
                    <p class="text-gray-600">@{{ profileData.username }} hasn't added any public items to their collection yet.</p>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <!-- Assuming ItemCard component is available -->
                    <ItemCard v-for="item in items" :key="item.id" :item="item" />
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const route = useRoute();
const username = route.params.username;
const currentUser = useStrapiUser();
const { find, findOne, update } = useStrapi();
const client = useStrapiClient();

// --- Reactive state for follow functionality ---
const isFollowing = ref(false);
const followersCount = ref(0);
const followPending = ref(false);

const { data: userData, pending, error } = await useAsyncData(
    `user-profile-${username}`,
    async () => {
        // 1. Find Target User by Username
        const userQuery = await find('users', {
            filters: { username: { $eq: username } },
            populate: ['profilePicture', 'following', 'followers'],
        });

        console.log("User Query Result:", userQuery);

        // Correctly access the user from the 'data' array
        const targetUser = userQuery[0];

        if (!targetUser) {
            throw createError({ statusCode: 404, message: `User @${username} not found` });
        }

        // 2. Fetch Target User's Public Items
        const itemsResponse = await find('items', {
            filters: {
                user: { id: { $eq: targetUser.id } },
                isPrivate: { $eq: false }
            },
            populate: ['userImages', 'manufacturer', 'series'],
            pagination: { pageSize: 100 },
            sort: ['createdAt:desc'],
        });
        console.log("Items Response:", itemsResponse);

        // 3. Determine isFollowing status
        let isFollowingStatus = false;
        if (currentUser.value && targetUser.followers) {
            isFollowingStatus = targetUser.followers.some(follower => follower.id === currentUser.value.id);
        }

        return {
            profile: targetUser,
            // FIX: Return the .data array from the response, not the whole object
            items: itemsResponse.data || [],
            isFollowing: isFollowingStatus,
        };
    }
);

// --- Computed Properties ---
// Use optional chaining (`?.`) to prevent errors if userData is null
const profileData = computed(() => userData.value?.profile);
const profileId = computed(() => userData.value?.profile?.id); // Get ID from top level
const items = computed(() => userData.value?.items || []);

// Watch for the async data to resolve and initialize local state
watch(userData, (newData) => {
    if (newData?.profile) {
        isFollowing.value = newData.isFollowing;
        followersCount.value = newData.profile.followers?.length || 0;
    }
}, { immediate: true });

useHead({
    title: () => profileData.value ? `${profileData.value.displayName || profileData.value.username}'s Profile` : 'User Profile'
});

const profilePictureUrl = computed(() => {
    return profileData.value?.profilePicture?.url || '/avatar-placeholder.png';
});

const memberSince = computed(() => {
    if (profileData.value?.createdAt) {
        return new Date(profileData.value.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
        });
    }
    return '';
});

// --- Action for Following/Unfollowing ---
const handleFollowToggle = async () => {
    // Guard clauses remain the same
    if (!currentUser.value || followPending.value || !profileId.value) return;

    followPending.value = true;

    // Determine the endpoint and the optimistic UI change
    const isCurrentlyFollowing = isFollowing.value;
    const endpoint = isCurrentlyFollowing
        ? `/users/${profileId.value}/unfollow`
        : `/users/${profileId.value}/follow`;

    try {
        // Optimistic UI Update: change the state immediately for a better UX
        isFollowing.value = !isCurrentlyFollowing;
        followersCount.value += !isCurrentlyFollowing ? 1 : -1;

        // Use the client to make a POST request to your custom endpoint.
        // The authentication token is automatically included.
        await client(endpoint, { method: 'POST' });

        // If the request succeeds, the optimistic update was correct.
        // No further action is needed.

    } catch (err) {
        console.error("Failed to update follow relationship:", err);

        // If the request fails, revert the optimistic UI changes
        isFollowing.value = isCurrentlyFollowing; // Revert to the original state
        followersCount.value += isCurrentlyFollowing ? 1 : -1; // Revert the count

        alert('An error occurred. Please try again.');
    } finally {
        followPending.value = false;
    }
};
</script>