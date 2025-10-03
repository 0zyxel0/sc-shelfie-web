<template>
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <!-- Card Header: User Info -->
        <div v-if="item.user" class="p-4 flex items-center space-x-3 border-b border-gray-100">
            <NuxtLink :to="userProfileLink">
                <img :src="userAvatarUrl" class="h-10 w-10 rounded-full object-cover bg-gray-200">
            </NuxtLink>
            <div>
                <NuxtLink :to="userProfileLink" class="font-semibold text-gray-800 hover:underline">
                    @{{ item.user.username }}
                </NuxtLink>
                <p class="text-xs text-gray-500">Added a new item</p>
            </div>
        </div>

        <!-- Card Body: Item Image and Name -->
        <NuxtLink :to="itemLink">
            <div class="aspect-w-1 aspect-h-1 bg-gray-100">
                <img v-if="itemImageUrl" :src="itemImageUrl" class="w-full h-full object-contain">
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-gray-900 truncate">{{ item.name }}</h3>
            </div>
        </NuxtLink>
    </div>
</template>

<script setup>
const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const config = useRuntimeConfig();

// --- Computed Properties for clean and safe data access ---
const userProfileLink = computed(() => `/users/${props.item.user?.username}`);
const itemLink = computed(() => `/items/${props.item.documentId || props.item.id}`);

const userAvatarUrl = computed(() => {
    const url = props.item.user?.profilePicture?.url;
    return url ? `${url}` : '~assets/img/avatar-placeholder.png';
});

const itemImageUrl = computed(() => {
    const url = props.item.userImages[0]?.url;
    return url ? `${url}` : null;
});
</script>