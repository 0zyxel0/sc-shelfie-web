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
            <!-- Use `userLoading` from useAuthUser for overall loading state -->
            <div v-if="userLoading" class="text-center text-gray-500">Loading connections...</div>
            <div v-else-if="!user" class="text-center text-gray-500">You must be logged in to view connections.</div>

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
import { ref, computed, watch } from 'vue'; // Explicitly import Vue refs/computed/watch

definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Connections | Shelfie' });

const route = useRoute();
const activeTab = ref(route.query.tab || 'following'); // Default to 'following' tab

// --- Use your custom composable for authentication and user data ---
const { user, isLoading: userLoading, fetchUser } = useAuthUser();
// No need for config here, as UserListItem now handles it internally
// const config = useRuntimeConfig();

// --- Ensure user data is loaded ---
// This will trigger the `useAuthUser().fetchUser()` if `user.value` is null,
// ensuring `user.following` and `user.followers` are populated via the BFF endpoint.
await useAsyncData(
    'connections-initial-user-fetch',
    async () => {
        if (!user.value) {
            await fetchUser();
        }
    },
    { server: true, lazy: true } // `lazy: true` means it won't block navigation if data is already there
);

// --- Derive connections from the global user state ---
const connections = computed(() => ({
    following: user.value?.following || [],
    followers: user.value?.followers || [],
}));

// Update activeTab if route query changes
watch(() => route.query.tab, (newTab) => {
    if (newTab) {
        activeTab.value = newTab;
    }
}, { immediate: true });

// REMOVED: The inline UserListItem definition
</script>

<style scoped>
.list-container {
    @apply bg-white rounded-lg shadow-sm divide-y divide-gray-200;
}

.empty-state {
    @apply bg-white p-6 rounded-lg shadow-sm text-center text-gray-600;
}
</style>