<template>
    <div class="bg-gray-100 min-h-screen">
        <!-- Loading State -->
        <div v-if="pending" class="text-center py-20 text-gray-500">
            Loading profile for @{{ username }}...
        </div>

        <!-- Error State -->
        <div v-else-if="error || !pageData" class="text-center py-20">
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
                        <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100" :src="profilePictureUrl" :alt="`${profile.username}'s profile picture`">
                    </div>

                    <!-- User Info -->
                    <div class="flex-1 text-center sm:text-left">
                        <h1 class="text-3xl font-bold text-gray-800">{{ profile.displayName || profile.username }}</h1>
                        <p class="text-md text-gray-500">@{{ profile.username }}</p>
                        <p class="text-sm text-gray-400 mt-1">Member since {{ memberSince }}</p>

                        <div class="mt-2 flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-600">
                            <span>
                                <span class="font-bold text-gray-800">{{ profile.followingCount }}</span> Following
                            </span>
                            <span>
                                <span class="font-bold text-gray-800">{{ followersCount }}</span> Followers
                            </span>
                        </div>
                    </div>

                    <!-- Action Buttons (Follow/Unfollow) -->
                    <div v-if="currentUser && currentUser.id !== profile.id" class="flex space-x-2 mt-4 sm:mt-0">
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
                    <p class="text-gray-600">@{{ profile.username }} hasn't added any public items to their collection yet.</p>
                </div>

                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <ItemCard v-for="item in items" :key="item.documentId" :item="item" />
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const route = useRoute();
const username = route.params.username;
const { user: currentUser } = useAuthUser();
const config = useRuntimeConfig();

const { data: pageData, pending, error } = await useAsyncData(
    `user-profile-${username}`,
    () => $fetch(`/api/users/${username}`)
);

console.log("Fetched user profile data:", pageData.value);

// --- Reactive state for follow functionality ---
const isFollowing = ref(false);
const followersCount = ref(0);
const followPending = ref(false);

// Separate computed properties for profile and items
const profile = computed(() => pageData.value?.profile);
const items = computed(() => pageData.value?.items || []);

// Watch for the async data to resolve and initialize our local reactive state
watch(pageData, (newData) => {
    if (newData) {
        isFollowing.value = newData.isFollowing;
        followersCount.value = newData.profile.followersCount;
    }
}, { immediate: true });

useHead({
    title: () => profile.value ? `${profile.value.displayName || profile.value.username}'s Profile` : 'User Profile'
});

const profilePictureUrl = computed(() => {
    if (profile.value?.profilePicture?.url) {
        return config.public.strapi.url + profile.value.profilePicture.url;
    }
    return '/avatar-placeholder.png';
});

const memberSince = computed(() => {
    if (profile.value?.createdAt) {
        return new Date(profile.value.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
        });
    }
    return '';
});

// --- New Action for Following/Unfollowing ---
const handleFollowToggle = async () => {
    if (!currentUser.value) {
        // This case should be rare since the button is hidden, but it's good practice
        return router.push('/auth');
    }

    followPending.value = true;
    try {
        // Optimistic UI Update: Toggle the state immediately
        const originalState = isFollowing.value;
        isFollowing.value = !isFollowing.value;
        followersCount.value += originalState ? -1 : 1; // Decrement if unfollowing, increment if following

        // Call the BFF endpoint
        await $fetch('/api/users/follow', {
            method: 'POST',
            body: {
                userIdToFollow: profile.value.id // Send the numerical ID
            }
        });
        // On success, do nothing, the UI is already updated.

    } catch (e) {
        console.error("Failed to follow/unfollow user:", e);
        // On failure, revert the optimistic update
        isFollowing.value = !isFollowing.value;
        followersCount.value += isFollowing.value ? -1 : 1;
        alert(e.data?.statusMessage || 'An error occurred. Please try again.');
    } finally {
        followPending.value = false;
    }
};
</script>