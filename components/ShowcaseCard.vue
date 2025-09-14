<template>
    <div class="group relative mb-6 break-inside-avoid">
        <NuxtLink :to="itemLink" class="block rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
            <img v-if="imageUrl" :src="imageUrl" class="w-full h-auto" alt="Item image">
            <div v-else class="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>

            <!-- Gradient overlay for text contrast -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg"></div>

            <!-- Top-right action icons -->
            <div class="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button class="bg-white/80 backdrop-blur-sm text-gray-800 rounded-full p-2 hover:bg-white">
                    <!-- Three dots icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
                    </svg>
                </button>
            </div>

            <!-- Bottom Overlays -->
            <div class="absolute bottom-0 left-0 right-0 p-3 text-white flex justify-between items-end">
                <!-- User Avatar & Name -->
                <NuxtLink v-if="item.user" :to="userProfileLink" class="flex items-center space-x-2 group/user opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <img :src="userAvatarUrl" class="h-8 w-8 rounded-full object-cover border-2 border-white/80 group-hover/user:border-white">
                    <span class="text-sm font-semibold text-white drop-shadow-md">{{ item.user.username }}</span>
                </NuxtLink>

                <!-- Like Count -->
                <div v-if="likeCount > 0" class="flex items-center space-x-1 text-sm bg-black/50 py-1 px-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ likeCount }}</span>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>

<script setup>
const props = defineProps({
    item: { type: Object, required: true }
});
const config = useRuntimeConfig();

const itemLink = computed(() => `/items/${props.item.documentId || props.item.id}`);
const userProfileLink = computed(() => `/users/${props.item.user?.username}`);
const likeCount = computed(() => props.item.likedBy?.length || 0);

const imageUrl = computed(() => {
    const url = props.item.userImages?.[0]?.url;
    return url ? `${config.public.strapi.url}${url}` : null;
});

const userAvatarUrl = computed(() => {
    const url = props.item.user?.profilePicture?.url;
    return url ? `${config.public.strapi.url}${url}` : '/avatar-placeholder.png';
});
</script>