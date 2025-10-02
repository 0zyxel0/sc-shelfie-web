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
                    <NuxtLink to="/my-shelf" class="text-blue-600 font-semibold hover:underline">View Your Shelf</NuxtLink>
                </div>
            </div>

            <!-- Feed Items -->
            <div v-else class="space-y-8">
                <FeedItemCard v-for="item in items" :key="item.id" :item="item" />
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed } from 'vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'News Feed | Shelfie' });

const currentUser = useStrapiUser();
const { findOne, find } = useStrapi();
const config = useRuntimeConfig();

// 1. Fetch the Current User with their 'following' list populated
const { data: userData, pending: userPending } = await useAsyncData(
    `current-user-following-${currentUser.value?.id}`,
    () => {
        const userId = currentUser.value?.id;
        if (!userId) return null;
        // Fetch the user data with the 'following' relation populated
        return findOne('users', userId, {
            populate: ['following']
        });
    },
    {
        transform: (response) => {
            // Assuming Strapi User responses are already flat or minimally wrapped
            const user = response?.data || response;

            // Extract IDs of users being followed
            let followingIds = [];
            // Handle the nested structure for relations if they weren't fully flattened
            if (user?.following?.data?.length) {
                followingIds = user.following.data.map(f => f.id);
            } else if (user?.following?.length) {
                // Handle fully flattened relation structure
                followingIds = user.following.map(f => f.id);
            }

            return {
                id: user.id,
                followingIds: followingIds,
            };
        },
        watch: [() => currentUser.value?.id],
        server: true
    }
);

// Get the list of IDs we are interested in
const followedUserIds = computed(() => userData.value?.followingIds || []);

// 2. Fetch the Feed Items using the list of followed IDs

const { data: itemsResponse, pending: itemsPending, error } = await useAsyncData(
    `feed-items-${currentUser.value?.id}`,
    async () => {
        const ids = followedUserIds.value;
        if (!ids || ids.length === 0) {
            return null; // Don't fetch if not following anyone
        }

        const query = {
            filters: {
                // Item must belong to a user in the followedUserIds array ($in operator)
                user: { id: { $in: ids } },
                // Item must NOT be private
                isPrivate: { $eq: false }
            },
            // Populate necessary display fields: the user who posted the item, and images
            populate: ['user', 'userImages', 'manufacturer', 'series'],
            sort: ['createdAt:desc'],
            pagination: { pageSize: 50 }, // Fetch 50 latest items
        };

        return await find('items', query);
    },
    {
        transform: (response) => {
            if (!response?.data) return [];

            // Transform based on the assumption that the plugin flattens the response
            return response.data.map(item => {
                const transformedItem = { id: item.id, ...item };

                // Flatten relations (assuming manufacturer, series, user are objects/arrays of objects)
                transformedItem.manufacturer = transformedItem.manufacturer?.name || null;
                transformedItem.series = transformedItem.series?.name || null;

                // Flatten user details (needed for FeedItemCard header)
                // Assuming user is a single object { id, username, ... }
                transformedItem.user = {
                    id: item.user?.id,
                    username: item.user?.username || 'Unknown',
                    // Include avatar if populated
                };

                // Media URL prefixing
                if (transformedItem.userImages?.length) {
                    transformedItem.userImages = transformedItem.userImages.map(img => ({
                        id: img.id,
                        url: img.url.startsWith('http') ? img.url : config.public.strapi.url + img.url
                    }));
                } else {
                    transformedItem.userImages = [];
                }

                // Use 'id' consistently for keying
                transformedItem.documentId = item.id;

                return transformedItem;
            });
        },
        // Re-run this fetch whenever the list of followed IDs changes
        watch: [followedUserIds],
        server: true
    }
);

const items = computed(() => itemsResponse.value || []);
const pending = computed(() => userPending.value || itemsPending.value);

</script>