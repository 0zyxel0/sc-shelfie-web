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

            <div v-else>
                <!-- Following List -->
                <div v-show="activeTab === 'following'">
                    <div v-if="!connections.following || connections.following.length === 0" class="empty-state">
                        <p>You aren't following anyone yet.</p>
                    </div>
                    <div v-else class="list-container">
                        <UserListItem v-for="user in connections.following" :key="user.id" :user="user" />
                    </div>
                </div>

                <!-- Followers List -->
                <div v-show="activeTab === 'followers'">
                    <div v-if="!connections.followers || connections.followers.length === 0" class="empty-state">
                        <p>You don't have any followers yet.</p>
                    </div>
                    <div v-else class="list-container">
                        <UserListItem v-for="user in connections.followers" :key="user.id" :user="user" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Connections | Shelfie' });

const route = useRoute();
const activeTab = ref(route.query.tab || 'following'); // Default to 'following' tab

const { data: connections, pending } = await useAsyncData(
    'connections-list',
    async () => {
        const { $strapi } = useNuxtApp();
        const user = useStrapiUser();

        // Fetch the logged-in user, populating BOTH relations at once
        const response = await $strapi.findOne('users', user.value.id, {
            populate: {
                following: { populate: 'profilePicture' },
                followers: { populate: 'profilePicture' }
            }
        });

        return {
            following: response.following || [],
            followers: response.followers || [],
        };
    }
);

// --- A reusable component for the user list item ---
const UserListItem = {
    props: ['user'],
    template: `
    <NuxtLink :to="'/users/' + user.username" class="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
      <img :src="user.profilePicture ? '${useRuntimeConfig().public.strapi.url}' + user.profilePicture.url : '/avatar-placeholder.png'" class="h-12 w-12 rounded-full object-cover">
      <div>
        <p class="font-bold text-gray-800">{{ user.displayName || user.username }}</p>
        <p class="text-sm text-gray-500">@{{ user.username }}</p>
      </div>
    </NuxtLink>
  `
};
</script>

<style scoped>
.list-container {
    @apply bg-white rounded-lg shadow-sm divide-y divide-gray-200;
}

.empty-state {
    @apply bg-white p-6 rounded-lg shadow-sm text-center text-gray-600;
}
</style>