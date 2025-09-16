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
          <button v-for="tag in tags" :key="tag.id" @click="activeTag = tag.name" :class="[...tagButtonBaseClasses, activeTag === tag.name ? tagButtonActiveClasses : tagButtonInactiveClasses]">
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
import qs from 'qs';
useHead({ title: 'Home | Shelfie' });

const config = useRuntimeConfig();
const activeTag = ref(null);

// --- DATA FETCHING (Using separate, stable useAsyncData calls) ---
const { data: items, pending: itemsPending } = await useAsyncData(
  'homepage-items',
  async () => {
    const query = qs.stringify({
      filters: { isPrivate: { $eq: false } },
      populate: '*',
      pagination: { pageSize: 100 },
      sort: 'createdAt:desc',
    }, { encodeValuesOnly: true });
    const response = await $fetch(`${config.public.strapi.url}/api/items?${query}`);
    console.log("Fetched items:", response);
    return response.data;
  },
  {
    // The proven transform function to flatten data
    transform: (response) => {
      console.log("Transforming items:", response);
      if (!response) return [];
      return response.map(item => {
        const flatItem = { id: item.id, ...item };
        // This is a simplified transform that you confirmed works for other pages.
        // Let's ensure relations are also handled if they're nested.
        if (flatItem.user?.data) { flatItem.user = { id: flatItem.user.data.id, ...flatItem.user.data }; }
        if (flatItem.itags?.data) { flatItem.itags = flatItem.itags.data.map(t => ({ id: t.id, ...t })); }
        return flatItem;
      });
    }
  }
);

const { data: tags, pending: tagsPending } = await useAsyncData(
  'homepage-tags',
  async () => {
    const response = await $fetch(`${config.public.strapi.url}/api/itags/top`);
    return response.data || response || [];
  }
);

if (process.client) {
  watch(items, (newItems) => {
    console.log('✅ Final Transformed items data:', newItems);
    if (newItems && newItems.length > 0) {
      console.log('Example itags:', newItems[0].itags);
    }
  }, { immediate: true });
}


const pending = computed(() => itemsPending.value || tagsPending.value);

// --- THE CORRECTED FILTERING LOGIC ---
const filteredItems = computed(() => {
  const allItems = items.value || [];
  if (!activeTag.value) {
    return allItems;
  }

  return allItems.filter(item => {
    // Check if the item has the `itags` property (which is now a simple array).
    if (!item.itags || !Array.isArray(item.itags)) {
      return false;
    }
    // Check if any tag in the now-flat array has a name that matches the activeTag.
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