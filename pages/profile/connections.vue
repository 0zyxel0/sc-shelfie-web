<template>
    <div>
        <main class="container mx-auto py-8 px-4 max-w-2xl">
            <div class="mb-6">
                <NuxtLink to="/profile" class="text-sm text-blue-600 hover:underline">&larr; Back to Profile</NuxtLink>
                <h1 class="text-3xl font-bold text-gray-800 mt-2">Connections</h1>
            </div>

            <!-- Tab Navigation -->
            <div class="border-b border-gray-200 mb-6">
                <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                    <button @click="activeTab = 'following'" :class="[
                        'py-3 px-1 border-b-2 font-medium text-sm',
                        activeTab === 'following'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]">
                        Following ({{ connections.following?.length || 0 }})
                    </button>
                    <button @click="activeTab = 'followers'" :class="[
                        'py-3 px-1 border-b-2 font-medium text-sm',
                        activeTab === 'followers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    ]">
                        Followers ({{ connections.followers?.length || 0 }})
                    </button>
                </nav>
            </div>

            <!-- Content Display -->
            <div v-if="pending" class="text-center text-gray-500">Loading connections...</div>
            <div v-else-if="!currentUser" class="text-center text-gray-500">You must be logged in to view connections.</div>

            <div v-else>
                <!-- Following List -->
                <div v-show="activeTab === 'following'">
                    <div v-if="!connections.following || connections.following.length === 0" class="empty-state">
                        <p>You aren't following anyone yet.</p>
                    </div>
                    <div v-else class="list-container">
                        <!-- UserListItem is now a separate component -->
                        <UserListItem v-for="connectionUser in connections.following" :key="connectionUser.id" :user="connectionUser" />
                    </div>
                </div>

                <!-- Followers List -->
                <div v-show="activeTab === 'followers'">
                    <div v-if="!connections.followers || connections.followers.length === 0" class="empty-state">
                        <p>You don't have any followers yet.</p>
                    </div>
                    <div v-else class="list-container">
                        <!-- UserListItem is now a separate component -->
                        <UserListItem v-for="connectionUser in connections.followers" :key="connectionUser.id" :user="connectionUser" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Connections | Shelfie' });

const route = useRoute();
const activeTab = ref(route.query.tab || 'following'); // Default to 'following' tab

const currentUser = useStrapiUser();
const { findOne } = useStrapi();


// --- Data Fetch: Current User Connections ---

const { data: connectionData, pending } = await useAsyncData(
    'my-connections',
    async () => {
        const userId = currentUser.value?.id;
        if (!userId) return null;

        // Fetch user data, populating both sides of the relationship
        const response = await findOne('users', userId, {
            // Populate following (users this user tracks) and followers (users tracking this user)
            populate: {
                following: ['profilePicture'], // Populate fields needed for UserListItem
                followers: ['profilePicture'],
            },
        });

        return response;
    },
    {
        transform: (response) => {
            if (!response) return { following: [], followers: [] };

            // Helper to handle fully flattened relations array (as per strict V5 assumption)
            const getFlattenedUsers = (relation) => {
                if (relation?.data) {
                    // Standard Strapi V5 many-relation format
                    return relation.data.map(u => ({
                        id: u.id,
                        // Assume full attributes are flattened into the root object if not in V5 format
                        username: u.attributes.username,
                        displayName: u.attributes.displayName,
                        profilePicture: u.attributes.profilePicture || null,
                    }));
                } else if (Array.isArray(relation)) {
                    // Fully flattened V5 assumption (response array contains user objects)
                    return relation.map(u => ({
                        id: u.id,
                        username: u.username,
                        displayName: u.displayName,
                        // Use the exact URL for profile picture
                        profilePicture: u.profilePicture ? { url: u.profilePicture.url } : null,
                    }));
                }
                return [];
            };


            // If the Strapi Nuxt module is configured for full flattening:
            const following = getFlattenedUsers(response.following || response.following?.data);
            const followers = getFlattenedUsers(response.followers || response.followers?.data);


            // If the user object itself is returned (not wrapped in attributes):
            const userEntity = response.data || response;

            // If the user object is NOT wrapped in attributes, try to access relations directly
            // and assume they are arrays of user objects
            const followingUsers = userEntity.following || [];
            const followerUsers = userEntity.followers || [];

            return {
                // If the strict V5 assumption holds, followingUsers and followerUsers are arrays of users
                following: getFlattenedUsers(followingUsers),
                followers: getFlattenedUsers(followerUsers),
            };

        },
        watch: [() => currentUser.value?.id],
        server: true
    }
);


// --- Derive connections from the fetched data ---
const connections = computed(() => connectionData.value || {
    following: [],
    followers: [],
});


// Update activeTab if route query changes
watch(() => route.query.tab, (newTab) => {
    if (newTab) {
        activeTab.value = newTab;
    }
}, { immediate: true });
</script>

<style scoped>
.list-container {
    @apply bg-white rounded-lg shadow-sm divide-y divide-gray-200;
}

.empty-state {
    @apply bg-white p-6 rounded-lg shadow-sm text-center text-gray-600;
}
</style>