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
      <!-- NOTE: Changed the loading condition to use the `pending` computed property -->
      <div v-if="pending" class="text-center text-gray-500">Loading...</div>
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

<script>
// Import child components explicitly
import ShowcaseCard from '@/components/ShowcaseCard.vue';

export default {
  // Register child components
  components: {
    ShowcaseCard,
  },

  // Set the page title
  head() {
    return {
      title: 'Home | Shelfie',
    };
  },

  // Data fetching hook for server-side rendering
  async asyncData({ $fetch }) {
    const config = useRuntimeConfig(); // We still use this composable to get config

    // Fetch items and tags concurrently for better performance
    const [itemsResponse, sortedTags] = await Promise.all([
      $fetch('/api/items', {
        method: 'GET',
        query: {
          filters: { isPrivate: { $eq: false } },
          populate: ['userImages', 'manufacturer', 'character', 'series', 'categories', 'itags'],
          'pagination[pageSize]': 100,
          sort: 'createdAt:desc',
        },
      }),
      $fetch('/api/tags/sorted')
    ]);

    // The same transformation logic as before
    const transformItems = (response) => {
      if (!response?.data) return [];
      return response.data.map(item => {
        const transformedItem = { id: item.id, ...item };
        if (transformedItem.manufacturer) transformedItem.manufacturer = transformedItem.manufacturer.name; else transformedItem.manufacturer = null;
        if (transformedItem.series) transformedItem.series = transformedItem.series.name; else transformedItem.series = null;
        if (transformedItem.categories?.length) transformedItem.categories = transformedItem.categories.map(cat => cat.name); else transformedItem.categories = [];
        if (transformedItem.itags?.length) {
          transformedItem.itags = transformedItem.itags.map(tag => ({
            id: tag.id,
            name: tag.name,
            voteCount: tag.voteCount || 0,
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
    };

    const items = transformItems(itemsResponse);

    // The returned object is merged into the component's data
    return {
      items,
      sortedTags,
    };
  },

  // Component's reactive state
  data() {
    return {
      activeTag: null,
      // `items` and `sortedTags` from asyncData are automatically available here.
      // We initialize them to null to help our `pending` computed property.
      items: null,
      sortedTags: null,

      // Button styles can be defined in data to be accessible in the template
      tagButtonBaseClasses: [
        'px-4', 'py-1.5', 'rounded-full', 'text-sm', 'font-semibold',
        'transition-colors', 'border', 'flex-shrink-0'
      ],
      tagButtonActiveClasses: 'bg-blue-600 text-white border-blue-600',
      tagButtonInactiveClasses: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400',
    };
  },

  // Computed properties to derive state
  computed: {
    // A replacement for the `pending` flags from useAsyncData
    pending() {
      return !this.items || !this.sortedTags;
    },

    filteredItems() {
      if (!this.activeTag) {
        return this.items;
      }
      return this.items.filter(item => {
        if (!item.itags || !Array.isArray(item.itags)) {
          return false;
        }
        return item.itags.some(tag => tag.name === this.activeTag);
      });
    },
  },
};
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