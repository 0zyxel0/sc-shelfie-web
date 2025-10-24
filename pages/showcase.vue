<template>
  <div class="bg-gray-50 min-h-screen">
    <main class="max-w-screen-xl mx-auto py-8 px-4">
      <!-- Header Area -->
      <div class="mb-6">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </NuxtLink>
        <div class="relative">
          <div class="text-center">
            <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">Latest Uploads</h1>
            <p class="mt-3 text-lg text-gray-600">See what fellow collectors have just added to their shelves.</p>
          </div>
          <!-- <NuxtLink to="/items/new" class="absolute top-0 right-0 h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </NuxtLink> -->
        </div>
      </div>

      <!-- New Uploads Banner -->
      <!-- <div class="text-center my-6">
          <button class="bg-blue-600 text-white font-semibold py-2 px-5 rounded-full shadow-md hover:bg-blue-700 transition-transform hover:scale-105">
              <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                  3 new uploads just now – click to refresh!
              </span>
          </button>
      </div> -->

      <!-- Trending Now -->
      <!-- <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
        <h2 class="flex items-center text-lg font-bold text-gray-800 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Trending Now
        </h2>
        <div class="flex flex-wrap gap-2">
          <button v-for="tag in trendingTags" :key="tag.name" class="bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full flex items-center hover:border-gray-400">
            #{{ tag.name }}
            <span class="ml-2 bg-gray-200 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{{ tag.count }}</span>
          </button>
        </div>
      </div> -->

      <!-- Category & Search Filters -->
      <div class="space-y-4 mb-8">
        <!-- Category Pills -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button @click="activeCategory = null" :class="[...categoryButtonBaseClasses, !activeCategory ? categoryButtonActiveClasses : categoryButtonInactiveClasses]">
            All Categories
          </button>
          <button v-for="category in categories" :key="category.id" @click="activeCategory = category.name" :class="[...categoryButtonBaseClasses, activeCategory === category.name ? categoryButtonActiveClasses : categoryButtonInactiveClasses]">
            {{ category.name }}
          </button>
        </div>
        <!-- Search, Sort, View -->
        <div class="bg-white p-3 rounded-lg border border-gray-200">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="relative flex-grow">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
              </div>
              <input type="text" v-model="searchQuery" placeholder="Search by item name, user, or tag..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-sm font-medium text-gray-500">Sort by:</span>
              <select class="border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500">
                <option>Newest</option>
                <option>Most Liked</option>
                <option>Most Commented</option>
              </select>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-x-3 gap-y-2 flex-wrap">
            <span class="text-sm font-semibold text-gray-600">Popular Tags:</span>
            <button v-for="tag in popularTags" :key="tag.id" @click="toggleTagFilter(tag.name)" :class="['text-sm px-3 py-1 rounded-full transition-colors', activeTag === tag.name ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700']">
              {{ tag.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div v-if="pending && items.length === 0" class="text-center text-gray-500 py-20">Loading...</div>
      <div v-else-if="error" class="text-center text-red-500 py-20">
        <h3 class="text-2xl font-semibold">Failed to load items</h3>
        <p class="mt-2">{{ error.message }}</p>
      </div>
      <div v-else-if="filteredItems.length === 0" class="text-center text-gray-500 py-20">
        <h3 class="text-2xl font-semibold">No results found</h3>
        <p class="mt-2">Try adjusting your filters or search term.</p>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <!-- Showcase Card -->
          <div v-for="item in filteredItems" :key="item.documentId" class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col group">
            <NuxtLink :to="`/items/${item.documentId}`" class="relative">
              <img :src="item.userImages[0]?.url || 'https://via.placeholder.com/400x300'" :alt="item.name" class="w-full h-56 object-cover group-hover:opacity-90 transition-opacity" />
              <span class="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded-full">{{ item.categories[0]?.name || 'Uncategorized' }}</span>
            </NuxtLink>
            <div class="p-4 flex-grow flex flex-col">
              <div class="flex items-center mb-3">
                <img :src="item.user.profilePicture?.url || '/avatar-placeholder.png'" class="w-8 h-8 rounded-full object-cover">
                <div class="ml-2 text-sm">
                  <p class="font-semibold text-gray-800">{{ item.user.username }}</p>
                  <p class="text-gray-500">{{ timeAgo(item.createdAt) }}</p>
                </div>
              </div>
              <h3 class="font-bold text-gray-900 flex-grow group-hover:text-blue-600 transition-colors">
                <NuxtLink :to="`/items/${item.documentId}`">{{ item.name }}</NuxtLink>
              </h3>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="tag in item.itags.slice(0, 3)" :key="tag.id" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{{ tag.name }}</span>
              </div>
            </div>
            <div class="p-4 border-t border-gray-200 flex items-center text-sm text-gray-500 space-x-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-1 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
                </svg>
                <span>{{ item.likedBy.length }}</span>
              </div>
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd"></path>
                </svg>
                <span>{{ item.commentCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-10">
          <button @click="loadMore" :disabled="loadMorePending || isLastPage" class="bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loadMorePending ? 'Loading...' : 'Load More Uploads' }}
          </button>
        </div>
      </div>
    </main>

    <!-- CTA Banner -->
    <div class="bg-gradient-to-r from-blue-500 to-teal-400">
      <div class="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
          <span class="block">Have something new to show off?</span>
        </h2>
        <p class="mt-4 text-lg leading-6 text-blue-100">Share your latest collectible addition with fellow enthusiasts.</p>
        <NuxtLink to="/items/new" class="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto">
          Upload Your Collectible
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const { find } = useStrapi();

useHead({ title: 'Latest Uploads | Shelfie' });

// --- Reactive State ---
const activeCategory = ref(null);
const activeTag = ref(null); // New state for popular tag filter
const searchQuery = ref('');
const items = ref([]);
const page = ref(1);
const pageSize = 16;
const totalItems = ref(0);
const loadMorePending = ref(false);

const isLastPage = computed(() => items.value.length >= totalItems.value);

// Mock data based on the UI
const trendingTags = ref([
  { name: 'Gundam', count: 237 }, { name: 'Funko Pop', count: 182 },
  { name: 'Retro', count: 145 }, { name: 'Vinyl', count: 118 }, { name: 'Marvel', count: 97 }
]);

// --- Data Fetching ---
const { data: initialData, pending, error } = await useAsyncData('showcase-data', async () => {
  const [itemsResponse, categoriesResponse, tagsResponse] = await Promise.all([
    find('items', {
      filters: { isPrivate: { $eq: false } },
      populate: {
        user: { populate: 'profilePicture' },
        userImages: true,
        categories: true,
        itags: true,
        likedBy: { count: true },
      },
      pagination: { page: 1, pageSize },
      sort: 'createdAt:desc',
    }),
    find('categories', { sort: 'name:asc' }),
    find('itags', { // Fetching popular tags
      sort: ["voteCount:desc", "name:asc"],
      pagination: { limit: 10 },
      fields: ["name"],
    })
  ]);
  return { items: itemsResponse.data, meta: itemsResponse.meta, categories: categoriesResponse.data, tags: tagsResponse.data };
});

if (initialData.value) {
  items.value = initialData.value.items;
  totalItems.value = initialData.value.meta.pagination.total;
}
const categories = computed(() => initialData.value?.categories || []);
const popularTags = computed(() => initialData.value?.tags || []);


// --- Filtering Logic ---
const filteredItems = computed(() => {
  let result = items.value;
  if (activeCategory.value) {
    result = result.filter(item => item.categories?.some(cat => cat.name === activeCategory.value));
  }
  if (activeTag.value) { // Filter by active popular tag
    result = result.filter(item => item.itags?.some(tag => tag.name === activeTag.value));
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.user.username.toLowerCase().includes(query) ||
      item.itags?.some(tag => tag.name.toLowerCase().includes(query))
    );
  }
  return result;
});


// --- Methods ---
const toggleTagFilter = (tagName) => {
  if (activeTag.value === tagName) {
    activeTag.value = null; // Deselect if already active
  } else {
    activeTag.value = tagName;
  }
};

const loadMore = async () => {
  if (isLastPage.value || loadMorePending.value) return;

  loadMorePending.value = true;
  page.value++;
  try {
    const newItemsResponse = await find('items', {
      filters: { isPrivate: { $eq: false } },
      populate: {
        user: { populate: 'profilePicture' },
        userImages: true, categories: true, itags: true, likedBy: { count: true },
      },
      pagination: { page: page.value, pageSize },
      sort: 'createdAt:desc',
    });
    items.value.push(...newItemsResponse.data);
    totalItems.value = newItemsResponse.meta.pagination.total;
  } catch (e) {
    console.error("Failed to load more items:", e);
    page.value--;
  } finally {
    loadMorePending.value = false;
  }
}

// --- Helpers ---
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

// --- Styling Constants ---
const categoryButtonBaseClasses = ['px-4', 'py-1.5', 'rounded-full', 'text-sm', 'font-semibold', 'transition-colors', 'border', 'flex-shrink-0'];
const categoryButtonActiveClasses = 'bg-blue-600 text-white border-blue-600';
const categoryButtonInactiveClasses = 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100';
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.animate-spin-slow {
  animation: spin 2s linear infinite;
}
</style>