<template>
  <div>
    <main class="container mx-auto py-8 px-4">

      <!-- Profile Header Card -->
      <div v-if="user" class="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div class="flex flex-col sm:flex-row items-center">
          <!-- Profile Picture -->
          <div class="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
            <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100" :src="profilePictureUrl" alt="User profile picture">
          </div>
          <!-- User Info -->
          <div class="flex-1 text-center sm:text-left">
            <h1 class="text-3xl font-bold text-gray-800">{{ user.displayName || user.username }}</h1>
            <p class="text-md text-gray-500">@{{ user.username }}</p>
            <p class="text-sm text-gray-400 mt-1">Member since {{ memberSince }}</p>
          </div>
          <!-- Action Buttons -->
          <div class="flex space-x-2 mt-4 sm:mt-0">
            <NuxtLink to="/profile/edit" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
              Edit Profile
            </NuxtLink>
            <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-md text-center">
          <p class="text-4xl font-bold text-blue-600">{{ collectionStats.totalItems }}</p>
          <p class="text-md font-medium text-gray-500 mt-1">Items in Collection</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md text-center">
          <p class="text-4xl font-bold text-yellow-600">{{ collectionStats.wishlistCount }}</p>
          <p class="text-md font-medium text-gray-500 mt-1">On Wishlist</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-md text-center">
          <p class="text-4xl font-bold text-green-600">{{ collectionStats.totalValue }}</p>
          <p class="text-md font-medium text-gray-500 mt-1">Estimated Collection Value</p>
        </div>
      </div>

      <!-- Recent Additions Section -->
      <div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Recent Additions</h2>

        <div v-if="pending" class="text-center text-gray-500">Loading recent items...</div>
        <div v-else-if="!recentItems || recentItems.length === 0" class="bg-white text-center p-8 rounded-lg shadow-md">
          <p class="text-gray-600">You haven't added any items to your collection yet.</p>
          <NuxtLink to="/items/new" class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
            Add Your First Item
          </NuxtLink>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <!-- We reuse the ItemCard component here -->
          <ItemCard v-for="item in recentItems" :key="item.id" :item="item" />
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import qs from 'qs';

definePageMeta({ middleware: 'auth' });

const { logout } = useStrapiAuth();
const router = useRouter();
const config = useRuntimeConfig();
const token = useStrapiToken();

// --- Fetch FRESH user data ---
const { data: profileData, pending: userPending } = await useAsyncData(
  'profile-data',
  async () => {
    if (!token.value) return null;
    const query = qs.stringify({ populate: 'profilePicture' });
    return await $fetch(`${config.public.strapi.url}/api/users/me?${query}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });
  }
);

useHead({
  title: () => profileData.value ? `${profileData.value.displayName || profileData.value.username}'s Profile` : 'My Profile'
});

// --- Fetch all items for the current user ---
const { data: userItems, pending: itemsPending } = await useAsyncData(
  `profile-items-${profileData.value?.id}`,
  async () => {
    if (!profileData.value?.id) return { data: [] };

    const queryParams = {
      populate: { userImages: { fields: ['url'] } },
      filters: { user: { id: { $eq: profileData.value.id } } },
      'pagination[pageSize]': 1000,
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
    watch: [() => profileData.value?.id]
  }
);

// --- Computed Properties for Display ---
const profilePictureUrl = computed(() => {
  if (profileData.value?.profilePicture?.url) {
    return config.public.strapi.url + profileData.value.profilePicture.url;
  }
  return '/avatar-placeholder.png';
});

const memberSince = computed(() => {
  if (profileData.value?.createdAt) {
    return new Date(profileData.value.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }
  return '';
});

// --- UPDATED COMPUTED PROPERTIES ---
const collectionStats = computed(() => {
  if (!userItems.value) {
    return { totalItems: 0, wishlistCount: 0, totalValue: '$0.00' };
  }

  // --- FIX: Using `itemStatus` instead of `status` ---
  const ownedItems = userItems.value.filter(i => i.itemStatus === 'Owned');
  const wishlistCount = userItems.value.filter(i => i.itemStatus === 'Wishlist').length;

  const totalValue = ownedItems.reduce((sum, item) => {
    return sum + (Number(item.purchasePrice) || 0);
  }, 0);

  return {
    totalItems: ownedItems.length,
    wishlistCount: wishlistCount,
    totalValue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalValue),
  };
});

const recentItems = computed(() => {
  if (!userItems.value) return [];
  // --- FIX: Using `itemStatus` instead of `status` ---
  // Show the 4 most recently added "Owned" items
  return userItems.value.filter(i => i.itemStatus === 'Owned').slice(0, 4);
});

// --- Update the template's data source ---
const user = profileData;
const pending = computed(() => userPending.value || itemsPending.value);

// --- Actions ---
const handleLogout = async () => {
  await logout();
  router.push('/auth');
};
</script>