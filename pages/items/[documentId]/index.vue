<template>
    <div class="bg-gray-100 min-h-screen">
        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center items-center h-screen">
            <div class="text-xl text-gray-500">Loading item...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error || !item" class="flex justify-center items-center h-screen">
            <div class="text-center">
                <h2 class="text-2xl text-red-600 font-bold mb-2">Failed to load item</h2>
                <p class="text-gray-600">The item could not be found or an error occurred.</p>
                <NuxtLink to="/" class="mt-4 inline-block text-blue-500 hover:underline">Go back home</NuxtLink>
            </div>
        </div>

        <!-- Content Display -->
        <div v-else class="container mx-auto p-4 md:p-8">
            <div class="bg-white rounded-lg shadow-xl overflow-hidden">
                <div class="grid grid-cols-1 lg:grid-cols-5">

                    <!-- Column 1: Image Gallery -->
                    <div class="lg:col-span-3 p-6">
                        <div class="aspect-w-1 aspect-h-1 w-full">
                            <img :src="mainImageUrl" alt="Main item image" class="w-full h-full object-contain rounded-lg transition-all duration-300">
                        </div>
                        <!-- Thumbnails -->
                        <div v-if="item.userImages && item.userImages.length > 1" class="mt-4 grid grid-cols-5 gap-2">
                            <div v-for="(image, index) in item.userImages" :key="image.id" @click="activeImageIndex = index" class="cursor-pointer border-2 rounded-md transition-all" :class="index === activeImageIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-400'">
                                <img :src="getStrapiMedia(image.url)" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover rounded">
                            </div>
                        </div>
                    </div>

                    <!-- Column 2: Item Details -->
                    <div class="lg:col-span-2 p-6 bg-gray-50/50 border-l border-gray-200">
                        <!-- Header -->
                        <div class="flex justify-between items-start">
                            <h1 class="text-3xl font-bold text-gray-900 tracking-tight">{{ item.name }}</h1>
                            <span class="ml-4 text-sm font-medium py-1 px-3 rounded-full capitalize" :class="statusBadgeClass">{{ item.itemStatus }}</span>
                        </div>

                        <!-- Owner Info -->
                        <div v-if="item.user" class="mt-2">
                            <p class="text-sm text-gray-500">
                                Cataloged by <NuxtLink :to="`/users/${item.user.username}`" class="font-medium text-blue-600 hover:underline">@{{ item.user.username }}</NuxtLink>
                            </p>
                        </div>

                        <!-- Likes & Edit Buttons -->
                        <div class="flex items-center space-x-4 mt-4">
                            <button @click="toggleLike" :disabled="likePending || !currentUser" class="flex items-center space-x-2 py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" :class="isLiked ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :fill="isLiked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                </svg>
                                <span>{{ likeCount }}</span>
                            </button>
                            <NuxtLink v-if="isOwner" :to="`/items/${docId}/edit`" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                Edit Item
                            </NuxtLink>
                        </div>

                        <!-- Metadata Section -->
                        <div class="mt-6">
                            <h3 class="font-semibold text-gray-700">Details</h3>
                            <dl class="mt-2 grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                                <div v-if="item.manufacturer" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Manufacturer</dt>
                                    <dd>{{ item.manufacturer.name }}</dd>
                                </div>
                                <div v-if="item.character" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Character</dt>
                                    <dd>{{ item.character.name }}</dd>
                                </div>
                                <div v-if="item.series" class="flex justify-between">
                                    <dt class="font-medium text-gray-800">Series</dt>
                                    <dd>{{ item.series.name }}</dd>
                                </div>
                            </dl>
                        </div>

                        <!-- Categories -->
                        <div v-if="item.categories && item.categories.length > 0" class="mt-6">
                            <h3 class="font-semibold text-gray-700">Categories</h3>
                            <div class="mt-2 flex flex-wrap gap-2">
                                <span v-for="category in item.categories" :key="category.id" class="text-xs font-semibold bg-gray-200 text-gray-700 py-1 px-3 rounded-full">
                                    {{ category.name }}
                                </span>
                            </div>
                        </div>
                        <div v-if="item.itags?.length > 0" class="mt-6">
                            <h3 class="font-semibold text-gray-700">Tags</h3>
                            <div class="mt-2 flex flex-wrap gap-2">
                                <span v-for="tag in item.itags" :key="tag.id" class="text-xs font-semibold bg-purple-100 text-purple-800 py-1 px-3 rounded-full">
                                    {{ tag.name }}
                                </span>
                            </div>
                        </div>

                        <!-- User Description -->
                        <div v-if="item.description" class="mt-6">
                            <h3 class="font-semibold text-gray-700">My Notes</h3>
                            <div class="prose prose-sm mt-2 max-w-none text-gray-600" v-html="item.description"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comment Section -->
            <div class="mt-8 bg-white p-6 rounded-lg shadow-xl">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Comments ({{ comments.length }})</h2>

                <!-- Comment Form -->
                <div class="mb-6">
                    <div v-if="currentUser">
                        <textarea v-model="newComment" rows="3" placeholder="Add a public comment..." class="form-input"></textarea>
                        <button @click="postComment" :disabled="commentPending || !newComment.trim()" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-400">
                            Post Comment
                        </button>
                    </div>
                    <div v-else class="text-center p-4 border rounded-lg bg-gray-50">
                        <p>You must be <NuxtLink to="/auth" class="text-blue-600 font-semibold hover:underline">logged in</NuxtLink> to post a comment.</p>
                    </div>
                </div>

                <!-- Comments List -->
                <div>
                    <div v-for="comment in comments" :key="comment.id" class="flex space-x-4 py-4 border-t first:border-t-0">
                        <img :src="getStrapiMedia(comment.user?.profilePicture?.url) || '/avatar-placeholder.png'" class="h-10 w-10 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">
                                <NuxtLink :to="`/users/${comment.user.username}`" class="hover:underline">@{{ comment.user.username }}</NuxtLink>
                            </p>
                            <div class="prose prose-sm mt-1 max-w-none text-gray-600" v-html="comment.content"></div>
                        </div>
                    </div>
                    <p v-if="comments.length === 0" class="text-gray-500 pt-4">Be the first to comment!</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import qs from 'qs';
import { ref, computed } from 'vue';
const route = useRoute();
const router = useRouter();
const docId = route.params.documentId;
const currentUser = useStrapiUser();
const token = useStrapiToken();
const config = useRuntimeConfig();

// --- 1. Fetch the CORE ITEM DATA ---
// This is the most important data for the page.
const { data: itemData, pending: itemPending, error: itemError } = await useAsyncData(
    `item-details-${docId}`,
    async () => {
        const query = qs.stringify({
            filters: { documentId: { $eq: docId } },
            populate: ['user', 'userImages', 'manufacturer', 'character', 'series', 'categories', 'itags', 'likedBy']
        });
        const response = await $fetch(`${config.public.strapi.url}/api/items?${query}`);
        if (!response.data || response.data.length === 0) throw new Error('Item not found');
        // Return the single, flattened item object.
        return { id: response.data[0].id, ...response.data[0] };
    }
);

// --- 2. Fetch the COMMENTS separately ---
// This fetch is not critical. If it fails, the page can still render.
const { data: comments, refresh: refreshComments } = await useAsyncData(
    `item-comments-${docId}`,
    async () => {
        const query = qs.stringify({
            filters: { item: { documentId: { $eq: docId } } },
            populate: { user: { populate: 'profilePicture' } },
            sort: 'createdAt:desc'
        });
        const response = await $fetch(`${config.public.strapi.url}/api/comments?${query}`);
        return (response.data || []).map(c => ({ id: c.id, ...c }));
    }
);

// --- Combine pending/error states for the main template ---
const pending = itemPending;
const error = itemError;
const item = itemData; // Use `item` directly in the template for simplicity

useHead({ title: () => item.value ? `${item.value.name} | Shelfie` : 'Item | Shelfie' });

// --- Reactive State for Likes & Comments ---
const likePending = ref(false);
const commentPending = ref(false);
const newComment = ref('');
const activeImageIndex = ref(0);

// --- Computed Properties (Now referencing `item.value` directly) ---
const likeCount = computed(() => item.value?.likedBy?.length || 0);

const isLiked = computed(() => {
    if (!currentUser.value || !item.value?.likedBy) return false;
    return item.value.likedBy.some(u => u.id === currentUser.value.id);
});

const isOwner = computed(() => {
    return currentUser.value && item.value?.user && currentUser.value.id === item.value.user.id;
});

const getStrapiMedia = (url) => url ? `${config.public.strapi.url}${url}` : null;

const mainImageUrl = computed(() => {
    if (item.value?.userImages?.length > 0) {
        const activeImage = item.value.userImages[activeImageIndex.value];
        return getStrapiMedia(activeImage.url);
    }
    return '/image-placeholder.png';
});

const statusBadgeClass = computed(() => {
    if (!item.value) return 'bg-gray-200 text-gray-800';
    switch (item.value.itemStatus) {
        case 'Owned': return 'bg-green-100 text-green-800';
        case 'Wishlist': return 'bg-yellow-100 text-yellow-800';
        case 'Pre-ordered': return 'bg-blue-100 text-blue-800';
        case 'For Sale': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
});

// --- ACTIONS ---
const toggleLike = async () => {
    if (!currentUser.value) return router.push('/auth');
    likePending.value = true;
    try {
        const currentLikes = (item.value.likedBy || []).map(u => u.id);
        const newLikes = isLiked.value
            ? currentLikes.filter(id => id !== currentUser.value.id)
            : [...currentLikes, currentUser.value.id];

        // Manually update the item data after a successful like
        const updatedItem = await $fetch(`${config.public.strapi.url}/api/items/${item.value.documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` },
            body: { data: { likedBy: newLikes } }
        });
        // Update our local state with the new data
        item.value.likedBy = newLikes;
    } catch (e) { console.error("Failed to toggle like:", e); }
    finally { likePending.value = false; }
};

const postComment = async () => {
    if (!newComment.value.trim()) return;
    commentPending.value = true;
    try {
        await $fetch(`${config.public.strapi.url}/api/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` },
            body: { data: { content: newComment.value, item: item.value.documentId, user: currentUser.value.id } }
        });
        newComment.value = '';
        refreshComments(); // Just refetch the comments, not the whole page
    } catch (e) { console.error("Failed to post comment:", e); }
    finally { commentPending.value = false; }
};
</script>
<style scoped>
.form-input {
    @apply w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors;
}
</style>