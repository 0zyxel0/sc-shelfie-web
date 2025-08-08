<template>
  <div class="bg-gray-900 text-white">
    <!-- 1. Sticky Header -->
    <header class="sticky top-0 z-50 bg-gray-900/70 backdrop-blur-lg border-b border-gray-700">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="text-2xl font-bold tracking-tighter">
            Shelfie
          </div>
          <NuxtLink to="/auth" class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded-full transition-colors duration-300">
            Login
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <!-- 2. Hero Section -->
      <section class="min-h-screen flex flex-col items-center justify-center text-center px-4 -mt-16">
        <div class="fade-in-container">
          <h1 v-fade-in class="text-5xl md:text-7xl font-bold tracking-tighter mb-4">
            Your Digital Collector Shelf.
          </h1>
          <p v-fade-in class="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            The ultimate app for cataloging, tracking, and sharing your prized collection of figures, models, and memorabilia.
          </p>
          <NuxtLink to="/auth" v-fade-in class="bg-white text-gray-900 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-200 transition-colors duration-300">
            Get Started Free
          </NuxtLink>
        </div>
      </section>

      <!-- 3. Feature Section 1: Catalog -->
      <section class="py-20 md:py-32 container mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div class="text-center md:text-left fade-in-container">
            <h2 v-fade-in class="text-4xl md:text-5xl font-bold tracking-tight mb-4">Catalog Everything. Instantly.</h2>
            <p v-fade-in class="text-lg text-gray-400 max-w-md mx-auto md:mx-0">
              Effortlessly add items with detailed information, high-resolution photos, and personal notes. Your entire collection, perfectly organized.
            </p>
          </div>
          <div v-fade-in class="flex justify-center">
            <!-- Replace with your image -->
            <img src="https://images.unsplash.com/photo-1593433600969-39a77a450257?q=80&w=800&auto=format&fit=crop" alt="A collection of figures on a shelf" class="rounded-2xl shadow-2xl max-w-sm w-full">
          </div>
        </div>
      </section>

      <!-- 4. Feature Section 2: Discover -->
      <section class="py-20 md:py-32 container mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div v-fade-in class="flex justify-center md:order-last">
            <!-- Replace with your image -->
            <img src="https://images.unsplash.com/photo-1611931849184-25293b2a2253?q=80&w=800&auto=format&fit=crop" alt="A person looking at a collectible figure" class="rounded-2xl shadow-2xl max-w-sm w-full">
          </div>
          <div class="text-center md:text-left fade-in-container">
            <h2 v-fade-in class="text-4xl md:text-5xl font-bold tracking-tight mb-4">Track Your Wishlist.</h2>
            <p v-fade-in class="text-lg text-gray-400 max-w-md mx-auto md:mx-0">
              Never miss a must-have item again. Keep a detailed wishlist, get release date notifications, and find the best prices.
            </p>
          </div>
        </div>
      </section>
      
      <!-- 5. Feature Section 3: Community -->
       <section class="py-20 md:py-32 container mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div class="text-center md:text-left fade-in-container">
            <h2 v-fade-in class="text-4xl md:text-5xl font-bold tracking-tight mb-4">Share Your Passion.</h2>
            <p v-fade-in class="text-lg text-gray-400 max-w-md mx-auto md:mx-0">
              Showcase your collection to a community of fellow enthusiasts. Get inspired, trade tips, and connect with collectors worldwide.
            </p>
          </div>
          <div v-fade-in class="flex justify-center">
            <!-- Replace with your image -->
            <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop" alt="A group of people looking at a screen" class="rounded-2xl shadow-2xl max-w-sm w-full">
          </div>
        </div>
      </section>

      <!-- 6. Final CTA Section -->
      <section class="py-20 md:py-40 text-center container mx-auto px-4">
        <div class="fade-in-container">
          <h2 v-fade-in class="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to build your shelf?</h2>
          <NuxtLink to="/auth" v-fade-in class="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-full text-xl transition-colors duration-300">
            Sign Up Now
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- 7. Footer -->
    <footer class="border-t border-gray-700">
        <div class="container mx-auto py-6 px-4 text-center text-gray-500">
            &copy; {{ new Date().getFullYear() }} Shelfie. All Rights Reserved.
        </div>
    </footer>
  </div>
</template>

<script setup>
// Set the page layout to be completely empty, ignoring any default layout
definePageMeta({
  layout: false,
});
</script>

<style scoped>
/*
  This is the CSS for our v-fade-in directive.
  Elements with the directive start off invisible and slightly moved.
*/
[v-fade-in] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.215, 0.61, 0.355, 1), 
              transform 0.8s cubic-bezier(0.215, 0.61, 0.355, 1);
}

/*
  The .is-visible class is added by our IntersectionObserver
  when the element scrolls into view.
*/
[v-fade-in].is-visible {
  opacity: 1;
  transform: translateY(0);
}

/*
  Staggered animation for elements inside a container.
  This makes text lines appear one after another.
*/
.fade-in-container [v-fade-in]:nth-child(2) { transition-delay: 150ms; }
.fade-in-container [v-fade-in]:nth-child(3) { transition-delay: 300ms; }
.fade-in-container [v-fade-in]:nth-child(4) { transition-delay: 450ms; }
</style>