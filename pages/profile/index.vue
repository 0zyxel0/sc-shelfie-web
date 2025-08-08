<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div v-if="user" class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div class="md:flex">
        <div class="md:shrink-0">
          <img class="h-48 w-full object-cover md:h-full md:w-48" :src="profilePictureUrl" alt="User profile picture">
        </div>
        <div class="p-8">
          <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{{ user.username }}</div>
          <h1 class="block mt-1 text-2xl leading-tight font-medium text-black">{{ user.displayName || 'No display name set' }}</h1>
          <p class="mt-2 text-slate-500">{{ user.email }}</p>

          <!-- Action Buttons -->
          <div class="mt-6 flex items-center space-x-4">
            <NuxtLink to="/profile/edit" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
              Edit Profile
            </NuxtLink>

            <!-- Logout Button -->
            <button @click="handleLogout" class="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
    <div v-else class="text-center">
      <p>Loading profile...</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' });
useHead({ title: 'My Profile' });

// --- 1. GET THE NECESSARY FUNCTIONS ---
const { logout } = useStrapiAuth(); // Get the logout function
const router = useRouter();          // Get the router for redirection
const user = useStrapiUser();
const config = useRuntimeConfig();

const profilePictureUrl = computed(() => {
  if (user.value?.profilePicture?.url) {
    const strapiUrl = config.public.strapi.url;
    return strapiUrl + user.value.profilePicture.url;
  }
  return '/avatar-placeholder.png';
});

// --- 2. DEFINE THE LOGOUT HANDLER ---
const handleLogout = async () => {
  // The logout function will clear the JWT token and the user state
  await logout();

  // Redirect the user to the auth page after they have been logged out
  router.push('/auth');
};
</script>