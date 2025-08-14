<template>
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">

        <!-- Left Side: Logo/Brand Name, always links to Home -->
        <NuxtLink to="/" class="text-2xl font-bold text-gray-800 tracking-tighter">
          Shelfie
        </NuxtLink>

        <!-- Right Side: Navigation & Actions -->
        <div class="flex items-center space-x-2 md:space-x-6">

          <!-- === AUTHENTICATED USER VIEW === -->
          <template v-if="user">
            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
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
</script>