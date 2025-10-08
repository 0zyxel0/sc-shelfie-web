<template>
  <!-- Main container with standard light theme -->
  <div class="bg-gray-100 min-h-screen">

    <!-- Tag Filter Bar -->
    <div class="sticky top-16 bg-white/80 backdrop-blur-lg z-30 border-b border-gray-200">
      <div class="container mx-auto px-4">
        <div class="flex items-center space-x-2 overflow-x-auto py-3 scrollbar-hide">
          <!-- "All" Button -->
          <button @click="activeTag = null" :class="[...tagButtonBaseClasses, !activeTag ? tagButtonActiveClasses : tagButtonInactiveClasses]">
            All Items
          </button>
          <!-- Tag Buttons -->
          <button v-for="tag in sortedTags" :key="tag.id" @click="activeTag = tag.name" :class="[...tagButtonBaseClasses, activeTag === tag.name ? tagButtonActiveClasses : tagButtonInactiveClasses]">
            {{ tag.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <main class="container mx-auto py-8 px-4">
      <!-- Use the 'pending' state from useAsyncData -->
      <div v-if="pending" class="text-center text-gray-500">Loading...</div>

      <!-- Use the 'error' state from useAsyncData -->
      <div v-else-if="error" class="text-center text-red-500 py-20">
        <h3 class="text-2xl font-semibold">Failed to load items</h3>
        <p class="mt-2">{{ error.message }}</p>
      </div>

      <div v-else-if="!filteredItems || filteredItems.length === 0" class="text-center text-gray-500 py-20">
        <h3 class="text-2xl font-semibold">No results found</h3>
        <p v-if="activeTag" class="mt-2">Try clearing the filter or exploring other tags.</p>
      </div>

      <!-- The Masonry Grid -->
      <div v-else class="masonry-grid">
        <ShowcaseCard v-for="item in filteredItems" :key="item.id" :item="item" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ShowcaseCard from '@/components/ShowcaseCard.vue';

// Define page meta and head
useHead({
  title: 'Home | Shelfie',
});

// --- Reactive State ---
const activeTag = ref(null);
const { find } = useStrapi();

// --- Data Fetching with useAsyncData ---
const { data, pending, error } = await useAsyncData('home-page-data', async () => {
  // Fetch items and tags concurrently
  const [itemsResponse, tagsResponse] = await Promise.all([
    find('items', {
      filters: { isPrivate: { $eq: false } },
      populate: {
        userImages: true,
        manufacturer: true,
        character: true,
        series: true,
        categories: true,
        itags: true,
      },
      pagination: { pageSize: 100 },
      sort: 'createdAt:desc',
    }),
    find('itags', {
      sort: ["voteCount:desc", "name:asc"],
      pagination: { limit: 50 },
      fields: ["name", "voteCount"],
    })
  ]);

  return {
    items: itemsResponse.data || [],
    tags: tagsResponse.data || [],
  };
});

// --- Computed Properties ---
// Safely access fetched data with fallbacks
const allItems = computed(() => data.value?.items || []);
const sortedTags = computed(() => data.value?.tags || []);

const filteredItems = computed(() => {
  if (!activeTag.value) {
    return allItems.value;
  }
  return allItems.value.filter(item =>
    item.itags?.some(tag => tag.name === activeTag.value)
  );
});

// --- Constants for Styling ---
const tagButtonBaseClasses = [
  'px-4', 'py-1.5', 'rounded-full', 'text-sm', 'font-semibold',
  'transition-colors', 'border', 'flex-shrink-0'
];
const tagButtonActiveClasses = 'bg-blue-600 text-white border-blue-600';
const tagButtonInactiveClasses = 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400';
</script>

<style scoped>
/* Masonry grid styles (no changes) */
.masonry-grid {
  column-count: 1;
  column-gap: 1.5rem;
}

@media (min-width: 640px) {
  .masonry-grid {
    column-count: 2;
  }
}

@media (min-width: 768px) {
  .masonry-grid {
    column-count: 3;
  }
}

@media (min-width: 1024px) {
  .masonry-grid {
    column-count: 4;
  }
}

@media (min-width: 1280px) {
  .masonry-grid {
    column-count: 5;
  }
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>