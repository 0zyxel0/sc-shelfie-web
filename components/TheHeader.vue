<template>
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">

        <!-- Left Side: Logo/Brand Name, always links to Home -->
        <NuxtLink to="/" class="text-2xl font-bold text-gray-800 tracking-tighter">
          Shelfie
        </NuxtLink>

        <div class="flex-1 px-4 lg:px-8">
          <form @submit.prevent="performSearch">
            <div class="relative">
              <input v-model="searchQuery" type="search" placeholder="Search items, characters, series..." class="w-full bg-gray-100 border-transparent rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </form>
        </div>

        <!-- Right Side: Navigation & Actions -->
        <div class="flex items-center space-x-2 md:space-x-6">

          <!-- === AUTHENTICATED USER VIEW === -->
          <template v-if="user">
            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
              <NuxtLink to="/feed" class="hover:text-blue-500" active-class="text-blue-600 font-semibold">Feed</NuxtLink>
              <NuxtLink to="/my-shelf" class="hover:text-blue-500" active-class="text-blue-600 font-semibold">My Shelf</NuxtLink>
              <NuxtLink to="/profile" class="hover:text-blue-500" active-class="text-blue-600 font-semibold">Profile</NuxtLink>
            </nav>

            <!-- Add Item Button -->
            <NuxtLink to="/items/new" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition-colors duration-300 text-sm">
              + Add Item
            </NuxtLink>

            <!-- Mobile Menu (for logged-in users) -->
            <div class="md:hidden">
              <button @click="isMenuOpen = !isMenuOpen" class="p-2 rounded-md text-gray-500 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div v-if="isMenuOpen" class="absolute top-16 right-4 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div class="py-1">
                  <NuxtLink to="/feed" @click="isMenuOpen = false" class="block ...">Feed</NuxtLink>
                  <NuxtLink to="/my-shelf" @click="isMenuOpen = false" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Shelf</NuxtLink>
                  <NuxtLink to="/profile" @click="isMenuOpen = false" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</NuxtLink>
                </div>
              </div>
            </div>
          </template>

          <!-- === GUEST (LOGGED-OUT) USER VIEW === -->
          <template v-else>
            <div class="flex items-center space-x-2">
              <NuxtLink to="/auth" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-full transition-colors text-sm">
                Sign In
              </NuxtLink>
            </div>
          </template>

        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
const user = useStrapiUser();
const isMenuOpen = ref(false);
const searchQuery = ref('');
const router = useRouter();

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${searchQuery.value.trim()}`);
  }
};
</script>