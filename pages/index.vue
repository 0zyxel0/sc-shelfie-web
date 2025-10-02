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
      <div v-if="itemsPending || tagsPending" class="text-center text-gray-500">Loading...</div>
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
useHead({ title: 'Home | Shelfie' });

const config = useRuntimeConfig();
const activeTag = ref(null);

// Strapi composable
const { find } = useStrapi();

// --- DATA FETCHING ---

// ✅ Fetch items directly from Strapi
const { data: items, pending: itemsPending } = await useAsyncData(
  'homepage-items',
  async () => {
    const response = await find('items', {
      populate: ['userImages', 'manufacturer', 'character', 'series', 'categories', 'itags'],
      filters: {
        isPrivate: { $eq: false }
      },
      pagination: { pageSize: 100 },
      sort: ['createdAt:desc']
    });

    if (!response?.data) return [];
    console.log('Fetched items:', response.data);

    return response.data.map(item => {
      const transformedItem = { id: item.id, ...item };

      // Flatten relations for ShowcaseCard
      transformedItem.user = item.user
        ? { id: item.user.id, ...item.user }
        : null;

      transformedItem.manufacturer = item.manufacturer?.name || null;
      transformedItem.series = item.series?.name || null;
      transformedItem.categories = item.categories?.map(cat => cat.name) || [];

      // Flatten itags with voteCount
      transformedItem.itags = item.itags?.map(tag => ({
        id: tag.id,
        name: tag.name,
        voteCount: tag.voteCount || 0
      })) || [];

      // Resolve image URLs
      transformedItem.userImages = item.userImages?.map(img => ({
        id: img.id,
        url: config.public.strapi.url + img.url
      })) || [];

      return transformedItem;
    });
  },
  { server: true }
);

// ✅ Fetch tags directly from Strapi
const { data: sortedTags, pending: tagsPending } = await useAsyncData(
  'homepage-sorted-tags',
  async () => {
    const response = await find('itags', {
      sort: ['voteCount:desc'], // assuming `voteCount` exists and you want sorted tags
    });

    return response?.data?.map(tag => ({
      id: tag.id,
      name: tag.name,
      voteCount: tag.voteCount || 0
    })) || [];
  },
  { server: true }
);


// --- FILTERING LOGIC ---
const filteredItems = computed(() => {
  const allItems = items.value || [];
  if (!activeTag.value) return allItems;
  console.log('Filtering items by tag:', activeTag.value);
  console.log('All items:', allItems);
  return allItems.filter(item =>
    item.itags?.some(tag => tag.name === activeTag.value)
  );
});

// Tailwind button classes
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