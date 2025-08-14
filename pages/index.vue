<template>
  <div>
    <main class="container mx-auto py-8 px-4">
      <div class="mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-800">Home</h1>
        <p class="mt-3 text-lg text-gray-600">Discover incredible collectibles from the Shelfie community.</p>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="text-center text-gray-500 py-10">
        <p>Loading the showcase...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!items || items.length === 0" class="text-center bg-white p-10 rounded-lg shadow-sm">
        <h3 class="text-xl font-semibold text-gray-800">The showcase is quiet... for now.</h3>
        <p class="text-gray-500 mt-2">No public items have been shared yet. Be the first!</p>
      </div>

      <!-- The Masonry Grid -->
      <div v-else class="masonry-grid">
        <!-- We use a standard v-for loop -->
        <div v-for="item in items" :key="item.id" class="masonry-item group relative mb-6 break-inside-avoid rounded-lg overflow-hidden shadow-lg">
          <NuxtLink :to="'/items/' + (item.documentId || item.id)">
            <img v-if="item.userImages?.length > 0" :src="`${config.public.strapi.url}${item.userImages[0].url}`" class="w-full h-auto" alt="Item image">
            <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>

            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h3 class="font-bold text-white text-lg truncate">{{ item.name }}</h3>
              <p v-if="item.user" class="text-sm text-gray-300">by {{ item.user.username }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import qs from 'qs';

useHead({ title: 'Home | Shelfie' });

const config = useRuntimeConfig();

const { data: items, pending } = await useAsyncData(
  'public-showcase-items',
  async () => {
    const queryParams = {
      filters: { isPrivate: { $eq: false } },
      populate: {
        userImages: { fields: ['url'] },
        user: { fields: ['username'] }
      },
      pagination: { limit: 50 },
      sort: 'createdAt:desc',
    };

    const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });
    const fullUrl = `${config.public.strapi.url}/api/items?${queryString}`;

    return await $fetch(fullUrl);
  },
  {
    transform: (response) => {
      if (!response?.data) return [];
      return response.data.map(item => ({ id: item.id, ...item }));
    },
  }
);
</script>

<style scoped>
.masonry-grid {
  /* Define the number of columns for different screen sizes */
  column-count: 1;
  column-gap: 1.5rem;
  /* Corresponds to gap-6 */
}

@media (min-width: 640px) {

  /* sm */
  .masonry-grid {
    column-count: 2;
  }
}

@media (min-width: 768px) {

  /* md */
  .masonry-grid {
    column-count: 3;
  }
}

@media (min-width: 1024px) {

  /* lg */
  .masonry-grid {
    column-count: 4;
  }
}

@media (min-width: 1280px) {

  /* xl */
  .masonry-grid {
    column-count: 5;
  }
}

.masonry-item {
  /* This prevents items from breaking across columns */
  break-inside: avoid;
}
</style>