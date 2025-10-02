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
const currentUser = useStrapiUser(); // Use useStrapiUser for current user info
const { find, findOne, update } = useStrapi(); // Import necessary Strapi actions
const config = useRuntimeConfig();

// --- Reactive state for follow functionality ---
const isFollowing = ref(false);
const followersCount = ref(0);
const followPending = ref(false);

// --- UTILITY: User Data Fetching and Assembly ---

const { data: userData, pending, error } = await useAsyncData(
    `user-profile-combined-${username}`,
    async () => {
        // 1. Find Target User by Username (Strapi /users endpoint)
        const userQuery = await find('users', {
            filters: { username: { $eq: username } },
            populate: ['profilePicture', 'following'], // Need following for initialization
        });

        const targetUser = userQuery.data?.[0];

        if (!targetUser) {
            return null;
        }

        // 2. Count Followers
        // Strapi requires filtering the 'following' relation on ALL users to find who follows the target user.
        // NOTE: This can be heavy on large datasets, but is the pure REST approach.
        const followersResponse = await find('users', {
            filters: { following: { id: { $eq: targetUser.id } } },
            pagination: { pageSize: 1 } // We only need the total count, not the data
        });
        const followersTotal = followersResponse?.meta?.pagination?.total || 0;


        // 3. Fetch Target User's Public Items
        const itemsResponse = await find('items', {
            filters: {
                user: { id: { $eq: targetUser.id } },
                isPrivate: { $eq: false }
            },
            populate: ['userImages', 'manufacturer', 'series'], // Populate necessary fields for ItemCard
            pagination: { pageSize: 100 },
            sort: ['createdAt:desc'],
        });

        // 4. Determine isFollowing status
        let isFollowingStatus = false;
        let followingIds = [];

        // Check current user's following list (populated in userQuery, if available)
        if (currentUser.value) {
            // Re-fetch current user data to ensure 'following' list is fresh
            const currentUserResponse = await findOne('users', currentUser.value.id, { populate: ['following'] });

            const followingRelation = currentUserResponse?.following;

            if (followingRelation?.data) {
                // Standard V5 response structure for many-relation
                followingIds = followingRelation.data.map(f => f.id);
            } else if (followingRelation) {
                // Flattened structure (assuming Nuxt Strapi configured this way)
                followingIds = followingRelation.map(f => f.id);
            }

            isFollowingStatus = followingIds.includes(targetUser.id);
        }

        // --- Transformation and Assembly (Strictly no .attributes) ---

        // Flatten User Profile Data
        const profile = {
            id: targetUser.id,
            username: targetUser.username,
            displayName: targetUser.displayName || targetUser.username,
            createdAt: targetUser.createdAt,
            followingCount: followingRelation?.data?.length || followingRelation?.length || 0, // Current user's following count
            // Map profile picture URL (Media Relation)
            profilePicture: targetUser.profilePicture ? {
                url: targetUser.profilePicture.url.startsWith('http') ? targetUser.profilePicture.url : config.public.strapi.url + targetUser.profilePicture.url,
            } : null
        };

        // Transform Items (Flatten relations and prefix URLs)
        const transformedItems = itemsResponse.data.map(item => {
            const transformedItem = { id: item.id, ...item };

            // Flatten single relations
            transformedItem.manufacturer = item.manufacturer?.name || null;
            transformedItem.series = item.series?.name || null;

            // Media URL prefixing
            if (transformedItem.userImages?.length) {
                transformedItem.userImages = transformedItem.userImages.map(img => ({
                    id: img.id,
                    url: img.url.startsWith('http') ? img.url : config.public.strapi.url + img.url
                }));
            } else {
                transformedItem.userImages = [];
            }
            return transformedItem;
        });


        return {
            profile,
            items: transformedItems,
            followersCount: followersTotal,
            isFollowing: isFollowingStatus,
            currentUserFollowingIds: followingIds,
        };
    }
);

// --- Component State & Computed Properties ---

const profileData = computed(() => userData.value?.profile);
const items = computed(() => userData.value?.items || []);
pending = computed(() => pending.value); // Re-map pending for template usage

// Watch for the async data to resolve and initialize local state
watch(userData, (newData) => {
    if (newData) {
        // Initialize reactive states from server data
        isFollowing.value = newData.isFollowing;
        followersCount.value = newData.followersCount;
    }
}, { immediate: true });

useHead({
    title: () => profileData.value ? `${profileData.value.displayName || profileData.value.username}'s Profile` : 'User Profile'
});

const profilePictureUrl = computed(() => {
    if (profileData.value?.profilePicture?.url) {
        return profileData.value.profilePicture.url; // Already prefixed in transform
    }
    return '/avatar-placeholder.png';
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
    if (!currentUser.value?.id || followPending.value || !profileData.value) return;

    followPending.value = true;

    // Get the current list of IDs the user is following
    const currentFollowingIds = userData.value.currentUserFollowingIds || [];
    const targetUserId = profileData.value.id;

    let newFollowingIds;
    let isNowFollowing = false;

    if (isFollowing.value) {
        // Unfollow: Remove the target ID
        newFollowingIds = currentFollowingIds.filter(id => id !== targetUserId);
    } else {
        // Follow: Add the target ID
        newFollowingIds = [...currentFollowingIds, targetUserId];
        isNowFollowing = true;
    }

    try {
        // Optimistic UI Update
        isFollowing.value = isNowFollowing;
        followersCount.value += isNowFollowing ? 1 : -1;

        // Update the current user's 'following' relation in Strapi
        await update('users', currentUser.value.id, {
            // Send the entire list of new relation IDs
            following: newFollowingIds
        });

        // Success: The local state (isFollowing and followersCount) and the underlying
        // userData (currentUserFollowingIds) are now updated.

    } catch (e) {
        console.error("Failed to update follow relationship:", e);
        // Revert UI on failure
        isFollowing.value = !isNowFollowing;
        followersCount.value += isNowFollowing ? -1 : 1;
        alert(e.response?.data?.error?.message || 'An error occurred. Please try again.');
    } finally {
        followPending.value = false;

        // Re-run the main data fetch (or the specific part that checks following)
        // to refresh the stored currentUserFollowingIds list and count if needed,
        // although the manual update above should suffice for the immediate state.

        // NOTE: We MUST manually update the internal state of userData.currentUserFollowingIds 
        // to ensure future follow toggles work correctly without a full page reload.
        if (!e) {
            userData.value.currentUserFollowingIds = newFollowingIds;
        }
    }
};
</script>