<!-- components/TagVoteButtons.vue -->
<template>
    <div class="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700 whitespace-nowrap">
        <span>{{ tag.name }} ({{ currentVoteCount }})</span>
        <div class="flex ml-2 space-x-1">
            <button @click.prevent="handleVote(props.tag.documentId, 'upvote')" :disabled="voteLoading[props.tag.documentId] || !user || !props.tag.documentId" :class="['text-gray-400 hover:text-green-500 transition-colors', { 'text-green-600': userVoteStatus === 'upvote' }]" title="Upvote Tag">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
            <button @click.prevent="handleVote(props.tag.documentId, 'downvote')" :disabled="voteLoading[props.tag.documentId] || !user || !props.tag.documentId" :class="['text-gray-400 hover:text-red-500 transition-colors', { 'text-red-600': userVoteStatus === 'downvote' }]" title="Downvote Tag">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';

const props = defineProps({
    tag: {
        type: Object, // Expects { id: number, name: string, voteCount: number }
        required: true,
        validator: (value) => { // Add a validator for early warning
            return value && typeof value.documentId === 'number' && typeof value.name === 'string';
        }
    },
});

const { user } = useAuthUser(); // Get global user state
const currentVoteCount = ref(props.tag.voteCount || 0);
const userVoteStatus = ref(null); // Stores the current user's vote status for THIS tag: 'upvote' | 'downvote' | null
const voteLoading = reactive({}); // Tracks loading state per tagId (though only one tag here)

// Debugging for initial prop value
// Use JSON.parse(JSON.stringify()) to get a plain object copy if props is a Proxy
console.log('TagVoteButtons: props.tag on setup:', JSON.parse(JSON.stringify(props.tag)));


// Function to fetch initial vote status for this specific tag
const fetchUserVoteStatus = async (tagId) => {
    console.log('TagVoteButtons: fetchUserVoteStatus called for tagId:', tagId); // Debugging
    if (!user.value || tagId === undefined || tagId === null) {
        userVoteStatus.value = null; // No user, or invalid tagId, means no vote status
        return;
    }
    voteLoading[tagId] = true;
    try {
        const response = await $fetch('/api/tags/user-vote-status', {
            method: 'GET',
            query: { tagId: tagId },
        });
        userVoteStatus.value = response.voteType;
    } catch (e) {
        console.error(`Failed to get vote status for tag ${tagId}:`, e);
        userVoteStatus.value = null;
    } finally {
        voteLoading[tagId] = false;
    }
};

onMounted(() => {
    // Ensure the tag ID is valid before fetching vote status
    if (props.tag) {
        fetchUserVoteStatus(props.tag.documentId);
    } else {
        console.error('TagVoteButtons: Cannot fetch vote status, tag.documentId is missing or invalid on mount:', props.tag);
    }
});

// Watch for changes in user (e.g., login/logout) or the tag prop itself
watch(() => [user.value, props.tag.documentId], () => {
    if (props.tag) {
        fetchUserVoteStatus(props.tag.documentId);
    } else {
        console.error('TagVoteButtons: Cannot fetch vote status, tag.documentId is missing or invalid on user/tag change:', props.tag);
    }
}, { deep: true });


const handleVote = async (tagId, voteType) => {
    console.log(`TagVoteButtons: handleVote called. Arguments: tagId=${tagId}, voteType=${voteType}`); // Debugging
    if (!user.value) {
        alert('You must be logged in to vote.');
        return;
    }

    // CRUCIAL CHECK: Ensure tagId is defined here BEFORE sending
    if (tagId === undefined || tagId === null || typeof tagId !== 'number') {
        console.error('TagVoteButtons: Attempted to vote with invalid tagId:', tagId);
        alert('Error: Tag ID is missing or invalid. Cannot vote.');
        return;
    }

    if (voteLoading[tagId]) return; // Prevent double-clicking

    voteLoading[tagId] = true;
    try {
        const response = await $fetch('/api/tags/vote', {
            method: 'POST',
            body: { tagId, voteType },
        });

        currentVoteCount.value = response.newVoteCount; // Update local count
        userVoteStatus.value = response.userVoteStatus; // Update local vote status

    } catch (e) {
        alert(e.data?.statusMessage || 'Failed to submit vote. Please try again.');
        console.error('Error submitting tag vote:', e);
    } finally {
        voteLoading[tagId] = false;
    }
};
</script>