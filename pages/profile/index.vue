<template>
  <div>
    <main class="container mx-auto py-8 px-4">

      <div v-if="user && !user.emailVerified" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-md mb-8" role="alert">
        <div class="flex">
          <div class="py-1">
            <svg class="h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.008a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <p class="font-bold">Verify Your Email Address</p>
            <p class="text-sm">
              Please check your inbox for a verification link.
              <button @click="resendEmail" :disabled="resendStatus !== 'idle'" class="ml-1 font-semibold underline hover:text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="resendStatus === 'sending'">Sending...</span>
                <span v-else>Resend Email</span>
              </button>
            </p>
            <p v-if="resendStatus === 'success'" class="text-sm mt-1 font-medium text-green-700">A new verification email has been sent!</p>
            <p v-if="resendStatus === 'error'" class="text-sm mt-1 font-medium text-red-700">Failed to send email. Please try again later.</p>
          </div>
        </div>
      </div>

      <!-- Profile Header Card -->
      <div v-if="user" class="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div class="flex flex-col sm:flex-row items-center">
          <!-- Profile Picture -->
          <div class="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
            <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100" :src="profilePictureUrl" alt="User profile picture">
          </div>
          <!-- User Info -->
          <div class="flex-1 text-center sm:text-left">
            <h1 class="text-3xl font-bold text-gray-800">{{ user.displayName || user.username }}
              <span v-if="isPremium" class="ml-3 mt-1 inline-flex items-center px-0.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Star class="w-3 h-3" fill="currentColor" />
                <span>Premium Member</span>
              </span>
            </h1>

            <span v-if="user.emailVerified" class="ml-3 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800" title="Email Verified">
              <svg class="-ml-0.5 mr-1.5 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Verified

            </span>
            <p class="text-md text-gray-500">@{{ user.username }}</p>
            <p class="text-sm text-gray-400 mt-1">Member since {{ memberSince }}</p>

            <div class="mt-2 flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-600">
              <NuxtLink to="/profile/connections?tab=following" class="hover:underline">
                <span class="font-bold text-gray-800">{{ user.following?.length || 0 }}</span> Following
              </NuxtLink>
              <NuxtLink to="/profile/connections?tab=followers" class="hover:underline">
                <span class="font-bold text-gray-800">{{ user.followers?.length || 0 }}</span> Followers
              </NuxtLink>
            </div>
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
import { Star } from 'lucide-vue-next'; // NEW: Import the Star icon
import { reloadNuxtApp } from "nuxt/app";
// REMOVE: `qs` is now used on the server, not the client.
// import qs from 'qs';

const { isPremium } = usePremiumStatus();

definePageMeta({ middleware: 'auth' });

// `useStrapiAuth` might manage client-side state for the frontend.
// The actual token logic is now HttpOnly cookie on the server.
const { logout } = useStrapiAuth();

const user = useStrapiUser();

const { find } = useStrapi();
const client = useStrapiClient();
const router = useRouter();
const config = useRuntimeConfig();
useHead({
  title: () => user.value ? `${user.value.displayName || user.value.username}'s Profile` : 'My Profile'
});

const { data: userItems, pending: itemsPending } = await useAsyncData(
  `profile-items-${user.value?.id}`, // The key should still depend on user ID
  async () => {
    console.log("User data in asyncData:", user.value);
    if (!user.value?.id) return { data: [] };
    console.log("Fetching items for user:", user.value.documentId);
    const queryParams = {
      populate: { userImages: { fields: ['url'] } },
      filters: { user: { documentId: { $eq: user.value.documentId } } },
      sort: 'createdAt:desc',
    };

    return await find('items', queryParams);
  },
  {
    transform: (response) => {
      console.log("Fetched items response:", response);
      if (!response?.data) return [];
      return response.data.map(item => ({ id: item.id, ...item }));
    },
    watch: [() => user.value?.id], // Watch the user from useAuthUser
    server: true
  }
);

// --- Computed Properties for Display ---
const profilePictureUrl = computed(() => {
  if (user.value?.profilePicture?.url) {
    return user.value.profilePicture.url || (config.public.strapi.url + user.value.profilePicture.url);
  }
  return '/avatar-placeholder.png';
});

const memberSince = computed(() => {
  if (user.value?.createdAt) {
    return new Date(user.value.createdAt).toLocaleDateString('en-US', {
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
  // Show the 4 most recently added "Owned" items
  return userItems.value.filter(i => i.itemStatus === 'Owned').slice(0, 4);
});

const resendStatus = ref('idle'); // 'idle', 'sending', 'success', 'error'

const resendEmail = async () => {
  resendStatus.value = 'sending';
  try {
    await client('/users/resend-verification-email', { method: 'POST' });
    resendStatus.value = 'success';
    setTimeout(() => { resendStatus.value = 'idle'; }, 5000);
  } catch (e) {
    console.error("Failed to resend verification email:", e);
    resendStatus.value = 'error';
    setTimeout(() => { resendStatus.value = 'idle'; }, 5000);
  }
};

// --- Update the template's data source ---
// `user` is now already reactive from `useAuthUser`
const pending = computed(() => itemsPending.value);

// --- Actions ---
const handleLogout = async () => {
  try {
    // This now calls our enhanced logout function which includes clearNuxtData()
    logout();
    reloadNuxtApp();
  } catch (e) {
    console.error("Logout failed on page:", e);
  } finally {
    // Redirect after logout is complete
    router.push('/auth');
  }
};
</script>