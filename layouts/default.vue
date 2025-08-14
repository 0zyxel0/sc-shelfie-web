<template>
    <div class="min-h-screen bg-gray-100">
        <!-- The new header will be included on every page using this layout -->
        <TheHeader />

        <!-- The page content is rendered here -->
        <main>
            <slot />
        </main>

        <!-- You can add a footer here later if you wish -->
        <!-- 
    <footer class="bg-white">
      <div class="container mx-auto py-4 px-4 text-center text-gray-500">
        &copy; {{ new Date().getFullYear() }} Shelfie
      </div>
    </footer>
    -->
    </div>
</template>

<script setup>
// No script needed here anymore
</script>