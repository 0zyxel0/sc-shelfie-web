<template>
    <div class="bg-gray-50 min-h-screen">
        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center items-center h-screen">
            <div class="text-xl text-gray-500">Loading item...</div>
        </div>

        <!-- Error State -->
        <div v-else-if="error || !item" class="flex justify-center items-center h-screen">
            <div class="text-center">
                <h2 class="text-2xl text-red-600 font-bold mb-2">Failed to load item</h2>
                <p class="text-gray-600">{{ error?.data?.statusMessage || "The item could not be found." }}</p>
                <NuxtLink to="/my-shelf" class="mt-4 inline-block text-blue-500 hover:underline">Go to My Collection</NuxtLink>
            </div>
        </div>

        <!-- Content Display -->
        <div v-else class="max-w-screen-xl mx-auto p-4 md:p-8">

            <!-- Breadcrumbs & Header -->
            <header class="mb-6">
                <nav class="text-sm font-medium text-gray-500 mb-3" aria-label="Breadcrumb">
                    <ol class="list-none p-0 inline-flex">
                        <li class="flex items-center">
                            <NuxtLink to="/" class="hover:text-gray-700">Home</NuxtLink>
                            <svg class="fill-current w-3 h-3 mx-3" xmlns="http://www.w.org/2000/svg" viewBox="0 0 320 512">
                                <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                            </svg>
                        </li>
                        <li class="flex items-center">
                            <NuxtLink to="/my-collection" class="hover:text-gray-700">My Collection</NuxtLink>
                            <svg class="fill-current w-3 h-3 mx-3" xmlns="http://www.w.org/2000/svg" viewBox="0 0 320 512">
                                <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z" />
                            </svg>
                        </li>
                        <li class="text-gray-400" aria-current="page">{{ item.name }}</li>
                    </ol>
                </nav>
                <div class="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                        <h1 class="text-4xl md:text-5xl font-bold text-gray-900">{{ item.name }}</h1>
                        <div class="mt-4 flex flex-wrap gap-2">
                            <span v-for="tag in combinedTags" :key="tag" class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{{ tag }}</span>
                        </div>
                        <div class="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                            <div class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {{ item.userImages.length }} Photos
                            </div>
                            <div class="flex items-center">
                                <svg xmlns="http://www.w.org/2000/svg" class="h-5 w-5 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Added {{ formattedDate(item.createdAt) }}
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2 mt-4 md:mt-0 flex-shrink-0">
                        <NuxtLink v-if="isOwner" :to="`/items/${docId}/edit`" class="action-button">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit Item
                        </NuxtLink>
                        <button @click="toggleLike" :disabled="likePending" class="action-button">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" :fill="isLiked ? 'currentColor' : 'none'" :class="isLiked ? 'text-red-500' : ''" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                            </svg>
                            {{ isLiked ? 'Favorited' : 'Add to Favorites' }}
                        </button>
                        <button class="action-button">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            Share
                        </button>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column: Image Gallery -->
                <div class="lg:col-span-2">
                    <div class="relative bg-white p-4 rounded-lg border border-gray-200">
                        <img :src="mainImageUrl" alt="Main item image" class="w-full aspect-square object-contain rounded-md">
                        <button @click="changeImage(-1)" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button @click="changeImage(1)" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow-md hover:bg-white transition">
                            <svg xmlns="http://www.w.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-center text-sm text-gray-500 mt-2">Full front view of the statue</p>
                    <div v-if="item.userImages && item.userImages.length > 1" class="mt-4 grid grid-cols-5 gap-4">
                        <img v-for="(image, index) in item.userImages" :key="image.id" @click="activeImageIndex = index" :src="image.url" :alt="`Thumbnail ${index + 1}`" class="w-full aspect-square object-cover rounded-lg cursor-pointer transition-all ring-offset-2" :class="index === activeImageIndex ? 'ring-2 ring-blue-500' : 'hover:opacity-80'">
                    </div>
                </div>

                <!-- Right Column: Details & Review -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Item Details Card -->
                    <div class="bg-white p-6 rounded-lg border border-gray-200">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">Item Details</h2>
                        <div class="space-y-4">
                            <!-- Status & Condition -->
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <DetailItem label="Status" :value="item.itemStatus" icon="check" />
                                <DetailItem label="Condition" value="Mint" />
                                <DetailItem label="Box Condition" value="Perfect" />
                                <DetailItem label="Acquired On" :value="formattedDate(item.purchaseDate)" />
                            </div>
                            <hr />
                            <!-- Acquisition -->
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <DetailItem label="Price" :value="formattedPrice(item.purchasePrice)" icon="price" />
                                <DetailItem label="Shop" value="SideShow Collectibles" icon="shop" />
                            </div>
                            <hr />
                            <!-- Specifications -->
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <DetailItem label="Manufacturer" :value="item.manufacturer?.name" />
                                <DetailItem label="Series" :value="item.series?.name" />
                                <DetailItem label="Scale" value="1/4" />
                                <DetailItem label="Material" value="Polystone" />
                                <DetailItem label="Height" value="52 cm" />
                                <DetailItem label="Weight" value="4.5 kg" />
                                <DetailItem label="Release Date" value="2023-03" />
                            </div>
                            <hr />

                            <!-- NEW: Tags with Voting -->
                            <div v-if="item.itags?.length > 0">
                                <div>
                                    <span class="text-sm text-gray-500 font-medium">Tags</span>
                                    <div class="mt-2 flex flex-wrap gap-2">
                                        <!-- Assuming TagVoteButtons component is auto-imported by Nuxt -->
                                        <TagVoteButtons v-for="tag in item.itags" :key="tag.id" :tag="tag" />
                                    </div>
                                </div>
                                <hr class="mt-4" />
                            </div>
                            <!-- Actions -->
                            <!-- <div class="flex items-center space-x-2">
                                <button class="flex-1 action-button-sm">Print</button>
                                <button class="flex-1 action-button-sm">QR Code</button>
                            </div> -->
                        </div>
                    </div>

                    <!-- Collector's Review Card -->
                    <div class="bg-white p-6 rounded-lg border border-gray-200">
                        <h2 class="text-xl font-bold text-gray-900 mb-3">Collector's Review</h2>
                        <div class="flex items-center mb-3">
                            <!-- Stars -->
                            <svg v-for="i in 5" :key="i" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        </div>
                        <p class="text-gray-600 text-sm leading-relaxed">{{ item.review }}</p>
                        <hr class="my-4" />
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <img :src="item.user?.profilePicture?.url || '/avatar-placeholder.png'" class="h-10 w-10 rounded-full object-cover">
                                <div class="ml-3">
                                    <p class="text-sm font-semibold text-gray-900">@{{ item.user?.username }}</p>
                                    <p class="text-xs text-gray-500">Premium Statues</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path>
                                    </svg>
                                    {{ likeCount }}
                                </div>
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    1243
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- More from this Collection -->
            <div v-if="moreItems.length" class="mt-12">
                <h2 class="text-3xl font-bold text-gray-900 mb-6">More from this Collection</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <NuxtLink v-for="moreItem in moreItems" :key="moreItem.id" :to="`/items/${moreItem.id}`" class="bg-white rounded-lg border border-gray-200 overflow-hidden group">
                        <img :src="moreItem.userImages[0]?.url || 'https://via.placeholder.com/400x300'" :alt="moreItem.name" class="w-full h-48 object-cover group-hover:opacity-90 transition-opacity">
                        <div class="p-4">
                            <h3 class="font-bold text-gray-900 truncate">{{ moreItem.name }}</h3>
                            <div class="mt-2 flex flex-wrap gap-1">
                                <span v-for="tag in moreItem.itags.slice(0, 2)" :key="tag.name" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ tag.name }}</span>
                                <span v-if="moreItem.itags.length > 2" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">+{{ moreItem.itags.length - 2 }}</span>
                            </div>
                            <p class="text-xs text-gray-500 mt-3">by @{{ item.user?.username }}</p>
                        </div>
                    </NuxtLink>
                </div>
            </div>

            <!-- NEW: Comment Section -->
            <div class="mt-12 bg-white p-6 rounded-lg border border-gray-200">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Comments ({{ comments?.length || 0 }})</h2>

                <!-- Comment Form -->
                <div class="mb-6">
                    <div v-if="currentUser">
                        <textarea v-model="newComment" rows="3" placeholder="Add a public comment..." class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"></textarea>
                        <button @click="postComment" :disabled="commentPending || !newComment.trim()" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-400 disabled:cursor-not-allowed">
                            Post Comment
                        </button>
                    </div>
                    <div v-else class="text-center p-4 border rounded-lg bg-gray-50">
                        <p>You must be <NuxtLink to="/login" class="text-blue-600 font-semibold hover:underline">logged in</NuxtLink> to post a comment.</p>
                    </div>
                </div>

                <!-- Comments List -->
                <div v-if="commentsPending" class="text-gray-500">Loading comments...</div>
                <div v-else>
                    <div v-for="comment in comments" :key="comment.id" class="flex space-x-4 py-4 border-t first:border-t-0">
                        <img :src="comment.user?.profilePicture?.url || '/avatar-placeholder.png'" class="h-10 w-10 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">
                                <NuxtLink :to="`/users/${comment.user?.username}`" class="hover:underline">@{{ comment.user?.username }}</NuxtLink>
                            </p>
                            <p class="prose prose-sm mt-1 max-w-none text-gray-600">{{ comment.content }}</p>
                        </div>
                    </div>
                    <p v-if="!comments || comments.length === 0" class="text-gray-500 pt-4">Be the first to comment!</p>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DetailItem from '~/components/DetailItem.vue';

const route = useRoute();
const router = useRouter();
const docId = route.params.documentId;
const currentUser = useStrapiUser();
const { findOne, find, update, create } = useStrapi();

const activeImageIndex = ref(0);
const likePending = ref(false);
const commentPending = ref(false);
const newComment = ref('');

// --- 1. Fetch main item data ---
const { data: item, pending, error } = await useAsyncData(
    `item-${docId}`,
    () => findOne('items', docId, {
        populate: ['userImages', 'manufacturer', 'series', 'categories', 'itags', 'likedBy', 'user.profilePicture'],
    }),
    { transform: response => response.data }
);

useHead({ title: () => item.value ? `${item.value.name} | Shelfie` : 'Item | Shelfie' });

// --- 2. Fetch more items from the same user ---
const { data: moreItems } = await useAsyncData(
    `more-items-by-user-${item.value?.user?.id}`,
    () => {
        if (!item.value?.user?.id) return [];
        return find('items', {
            filters: { user: { id: { $eq: item.value.user.id } }, documentId: { $ne: docId } },
            populate: ['userImages', 'itags'],
            pagination: { limit: 3 }
        });
    },
    { transform: response => response.data, watch: [() => item.value?.user?.id] }
);

// --- 3. Fetch Comments ---
const { data: comments, pending: commentsPending, refresh: refreshComments } = await useAsyncData(
    `comments-for-item-${docId}`,
    () => find('comments', {
        filters: { item: { documentId: { $eq: docId } } },
        populate: { user: { populate: "profilePicture" } },
        sort: "createdAt:desc",
    }),
    { transform: response => response.data }
);

// --- Computed Properties ---
const isOwner = computed(() => currentUser.value && item.value?.user && currentUser.value.id === item.value.user.id);
const likeCount = computed(() => item.value?.likedBy?.length || 0);
const isLiked = computed(() => {
    if (!currentUser.value || !item.value?.likedBy) return false;
    return item.value.likedBy.some(u => u.id === currentUser.value.id);
});
const mainImageUrl = computed(() => (item.value?.userImages?.length > 0) ? item.value.userImages[activeImageIndex.value]?.url : '/image-placeholder.png');
const combinedTags = computed(() => {
    const tags = new Set();
    item.value?.categories?.forEach(cat => tags.add(cat.name));
    item.value?.itags?.forEach(tag => tags.add(tag.name));
    return Array.from(tags);
});

// --- Formatting Helpers ---
const formattedDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
const formattedPrice = (price) => (price === null || price === undefined) ? 'N/A' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

// --- Methods ---
const changeImage = (direction) => {
    const numImages = item.value.userImages.length;
    if (numImages <= 1) return;
    activeImageIndex.value = (activeImageIndex.value + direction + numImages) % numImages;
};

const toggleLike = async () => {
    if (!currentUser.value) return router.push('/login');
    likePending.value = true;
    try {
        const currentLikes = item.value.likedBy.map(u => u.id);
        const newLikes = isLiked.value ? currentLikes.filter(id => id !== currentUser.value.id) : [...currentLikes, currentUser.value.id];
        await update('items', docId, { likedBy: newLikes });
        item.value.likedBy = isLiked.value ? item.value.likedBy.filter(u => u.id !== currentUser.value.id) : [...item.value.likedBy, { id: currentUser.value.id }];

    } catch (e) {
        console.error("Failed to toggle like:", e);
        alert('Failed to update like status.');
    } finally {
        likePending.value = false;
        reloadNuxtApp();
    }
};

const postComment = async () => {
    if (!newComment.value.trim() || !currentUser.value) return;
    commentPending.value = true;
    try {
        await create('comments', {
            item: item.value.id,
            content: newComment.value,
            user: currentUser.value.id
        });
        newComment.value = '';
        reloadNuxtApp();
    } catch (e) {
        console.error("Failed to post comment:", e);
        alert('Failed to post comment.');
    } finally {
        commentPending.value = false;
    }
};
</script>

<style scoped>
.action-button {
    @apply inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors;
}

.action-button-sm {
    @apply inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors;
}
</style>