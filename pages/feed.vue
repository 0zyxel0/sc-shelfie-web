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

            <!-- Empty State -->
            <div v-else-if="!items || items.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
                <h3 class="text-xl font-semibold text-gray-800">Your feed is empty</h3>
                <p class="text-gray-500 mt-2">Follow some users to see their new items here, or add your own!</p>
                <div class="mt-4">
                    <NuxtLink to="/" class="text-blue-600 font-semibold hover:underline">Discover Users</NuxtLink>
                </div>
            </div>

            <!-- Feed Items -->
            <div v-else class="space-y-8">
                <!-- We now use our new, proper component -->
                <FeedItemCard v-for="item in items" :key="item.id" :item="item" />
            </div>
        </main>
    </div>
</template>

<script setup>
import qs from 'qs';
definePageMeta({ middleware: 'auth' });
useHead({ title: 'News Feed | Shelfie' });

const currentUser = useStrapiUser();
const config = useRuntimeConfig();

const { data: items, pending } = await useAsyncData(
    `feed-${currentUser.value?.id}`,
    async () => {
        if (!currentUser.value?.id) return [];

        // 1. Fetch the list of users the current user is following
        const followingResponse = await $fetch(`${config.public.strapi.url}/api/users/me?populate=following`, {
            headers: { Authorization: `Bearer ${useStrapiToken().value}` }
        });

        const followingIds = (followingResponse.following || []).map(u => u.id);

        if (followingIds.length === 0) {
            return [];
        }

        // 2. Fetch public items created by those users
        const itemsQuery = qs.stringify({
            filters: {
                user: { id: { $in: followingIds } },
                isPrivate: { $eq: false }
            },
            populate: {
                user: { populate: 'profilePicture' },
                userImages: { fields: ['url'] }
            },
            sort: 'createdAt:desc',
            'pagination[limit]': 25,
        }, { encodeValuesOnly: true });

        const response = await $fetch(`${config.public.strapi.url}/api/items?${itemsQuery}`);
        return response.data; // Return the raw data with attributes
    },
    {
        // Flatten the data for easier use in the component
        transform: (response) => {
            if (!response) return [];
            return response.map(item => {
                const flatItem = { id: item.id, ...item };
                // Flatten nested relations for easier access
                if (flatItem.user?.data) {
                    flatItem.user = { id: flatItem.user.data.id, ...flatItem.user.data };
                }
                if (flatItem.userImages?.data) {
                    flatItem.userImages = flatItem.userImages.data.map(img => ({ id: img.id, ...img }));
                }
                return flatItem;
            });
        },
        watch: [() => currentUser.value?.id]
    }
);

// The inline FeedItemCard definition is now GONE.
</script>