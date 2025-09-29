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
          <!-- Tag Buttons (now sorted by voteCount, but only name displayed) -->
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
import { ref, computed } from 'vue'; // Explicitly import ref, computed
// Removed `qs` as it's not used client-side here
useHead({ title: 'Home | Shelfie' });

const config = useRuntimeConfig();
const activeTag = ref(null);

// --- DATA FETCHING ---
const { data: items, pending: itemsPending } = await useAsyncData(
  'homepage-items',
  async () => {
    // Calling your existing BFF endpoint for items.
    // Ensure `itags` are populated to allow client-side filtering.
    // The `/api/items.get.ts` has been updated to ensure deep populate for itags with voteCount.
    return await $fetch('/api/items', {
      method: 'GET',
      query: {
        filters: { isPrivate: { '$eq': false } },
        populate: ['userImages', 'manufacturer', 'character', 'series', 'categories', 'itags'], // Request itags to be populated
        'pagination[pageSize]': 100,
        sort: 'createdAt:desc',
      },
    });
  },
  {
    transform: (response) => {
      if (!response?.data) return [];
      return response.data.map(item => {
        const transformedItem = { id: item.id, ...item };

        // Flatten relations as needed for ShowcaseCard (similar to my-shelf.vue)
        if (transformedItem.user) {
          transformedItem.user = { id: transformedItem.user.id, ...transformedItem.user };
        } else if (transformedItem.user) { // If user is just ID
          transformedItem.user = { id: transformedItem.user.id };
        } else {
          transformedItem.user = null; // Ensure user is null if no data
        }

        if (transformedItem.manufacturer) {
          transformedItem.manufacturer = transformedItem.manufacturer.name;
        } else { transformedItem.manufacturer = null; }

        if (transformedItem.series) {
          transformedItem.series = transformedItem.series.name;
        } else { transformedItem.series = null; }

        if (transformedItem.categories?.length) {
          transformedItem.categories = transformedItem.categories.map(cat => cat.name);
        } else { transformedItem.categories = []; }

        // --- Crucially, flatten itags from item response, including voteCount ---
        if (transformedItem.itags?.length) {
          transformedItem.itags = transformedItem.itags.map(tag => ({
            id: tag.id,
            name: tag.name,
            voteCount: tag.voteCount || 0, // Include voteCount for potential future use or display
          }));
        } else {
          transformedItem.itags = [];
        }

        if (transformedItem.userImages?.length) {
          transformedItem.userImages = transformedItem.userImages.map(img => ({
            id: img.id,
            url: config.public.strapi.url + img.url,
          }));
        } else {
          transformedItem.userImages = [];
        }

        return transformedItem;
      });
    },
    server: true // Ensure this runs during SSR
  }
);

// --- Fetch tags, now from the new sorted BFF endpoint ---
const { data: sortedTags, pending: tagsPending } = await useAsyncData(
  'homepage-sorted-tags',
  async () => {
    // Call your new BFF endpoint for sorted tags
    return await $fetch('/api/tags/sorted');
  },
  { server: true } // Ensure this runs during SSR
);

const pending = computed(() => itemsPending.value || tagsPending.value);

// --- THE FILTERING LOGIC ---
const filteredItems = computed(() => {
  const allItems = items.value || [];
  if (!activeTag.value) {
    return allItems;
  }

  return allItems.filter(item => {
    if (!item.itags || !Array.isArray(item.itags)) {
      return false;
    }
    // Check if any tag in the item's `itags` array has a name that matches `activeTag`.
    return item.itags.some(tag => tag.name === activeTag.value);
  });
});

// Tailwind classes for buttons
const tagButtonBaseClasses = ['px-4', 'py-1.5', 'rounded-full', 'text-sm', 'font-semibold', 'transition-colors', 'border', 'flex-shrink-0'];
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