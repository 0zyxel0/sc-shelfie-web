<!-- components/TagVoteButtons.vue -->
<template>
    <div class="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700 whitespace-nowrap">
        <span>{{ tag.name }} ({{ currentVoteCount }})</span>
        <div class="flex ml-2 space-x-1">
            <button @click.prevent="handleVote(props.tag.documentId, 'upvote')" :disabled="voteLoading[props.tag.documentId] || !user || !props.tag.documentId" :class="['text-gray-400 hover:text-green-500 transition-colors', { 'text-green-600': userVoteStatus === 'upvote' }]" title="Upvote Tag">
                <svg v-if="voteLoading[props.tag.documentId]" class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                </svg>

            </button>
            <!-- MODIFIED: Downvote Button with Thumbs Down Icon -->
            <button @click.prevent="handleVote(props.tag.documentId, 'downvote')" :disabled="voteLoading[props.tag.documentId] || !user || !props.tag.documentId" :class="['text-gray-400 hover:text-red-500 transition-colors', { 'text-red-600': userVoteStatus === 'downvote' }]" title="Downvote Tag">
                <svg v-if="voteLoading[props.tag.documentId]" class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';

const { find, findOne, create, update, delete: _delete } = useStrapi(); // Added findOne

const props = defineProps({
    tag: {
        type: Object, // Expects { id: number, name: string, voteCount: number }
        required: true,
        validator: (value) => { // Add a validator for early warning
            return value && typeof value.documentId === 'number' && typeof value.name === 'string';
        }
    },
});

const user = useStrapiUser(); // Get global user state
const currentVoteCount = ref(props.tag.voteCount || 0);
const userVoteStatus = ref(null); // Stores the current user's vote status for THIS tag: 'upvote' | 'downvote' | null
const voteLoading = reactive({}); // Tracks loading state per tagId

// Function to fetch initial vote status for this specific tag
const fetchUserVoteStatus = async (tagId) => {
    if (!user.value || tagId === undefined || tagId === null) {
        userVoteStatus.value = null;
        return;
    }
    voteLoading[tagId] = true;
    try {
        const response = await find('user-tag-votes', { filters: { user: { id: { $eq: user.value.id } }, itag: { documentId: { $eq: tagId } } } });
        if (response.data.length === 0) {
            userVoteStatus.value = null;
            return;
        }
        userVoteStatus.value = response.data[0].voteType; // Access attributes for v4 response
    } catch (e) {
        console.error(`Failed to get vote status for tag ${tagId}:`, e);
        userVoteStatus.value = null;
    } finally {
        voteLoading[tagId] = false;
    }
};

onMounted(() => {
    if (props.tag && props.tag.documentId !== undefined) {
        fetchUserVoteStatus(props.tag.documentId);
    }
});

watch(() => [user.value, props.tag.documentId], () => {
    if (props.tag && props.tag.documentId !== undefined) {
        fetchUserVoteStatus(props.tag.documentId);
    }
}, { deep: true });


const handleVote = async (tagId, voteType) => {
    if (!user.value) {
        alert('You must be logged in to vote.');
        return;
    }
    if (tagId === undefined || tagId === null) {
        console.error('TagVoteButtons: Attempted to vote with invalid tagId:', tagId);
        alert('Error: Tag ID is missing or invalid. Cannot vote.');
        return;
    }
    if (voteLoading[tagId]) return;

    voteLoading[tagId] = true;
    try {
        // FIX #1: Removed the trailing dot after user.value.id
        const existingVoteResponse = await find('user-tag-votes', { filters: { user: { id: { $eq: user.value.id } } }, itag: { documentId: { $eq: tagId } } });

        const existingVote = existingVoteResponse.data[0];
        console.log('Existing vote fetched:', existingVote);

        let voteChange = 0;
        let finalUserVoteStatus = null; // To optimistically update the UI

        if (existingVote) {
            if (existingVote.voteType === voteType) {
                // Same vote, so undo it
                voteChange = voteType === "upvote" ? -1 : 1;
                await _delete('user-tag-votes', existingVote.documentId);
                finalUserVoteStatus = null;
                // FIX #2: Replaced undefined `userId` with `user.value.id`
                console.log(`BFF - Deleted existing ${existingVote.voteType} vote for user ${user.value.id} on tag ${tagId}`);
            } else {
                // Different vote, so change it
                voteChange = voteType === "upvote" ? 2 : -2;
                await update('user-tag-votes', existingVote.documentId, { voteType: voteType });
                finalUserVoteStatus = voteType;
                // FIX #2: Replaced undefined `userId` with `user.value.id`
                console.log(`BFF - Updated vote from ${existingVote.voteType} to ${voteType} for user ${user.value.id} on tag ${tagId}`);
            }
        } else {
            // No existing vote, so create a new one
            voteChange = voteType === "upvote" ? 1 : -1;
            await create('user-tag-votes',
                {
                    user: user.value.id,
                    itag: tagId,
                    voteType: voteType,
                }
            );
            finalUserVoteStatus = voteType;
            // FIX #2: Replaced undefined `userId` with `user.value.id`
            console.log(`BFF - Created new ${voteType} vote for user ${user.value.id} on tag ${tagId}`);
        }

        // Optimistically update UI before waiting for the final tag update
        currentVoteCount.value += voteChange;
        userVoteStatus.value = finalUserVoteStatus;

        // Update the master vote count on the tag itself
        const { data: currentTag } = await findOne('itags', tagId, { fields: '*' });
        if (!currentTag) {
            throw new Error("Tag not found.");
        }
        const newTagVoteCount = (currentTag.voteCount || 0) + voteChange;
        await update('itags', tagId, { voteCount: newTagVoteCount });

    } catch (e) {
        alert(e.message || 'Failed to submit vote. Please try again.');
        console.error('Error submitting tag vote:', e);
        // Revert optimistic update on failure
        fetchUserVoteStatus(tagId); // Re-fetch the true state
    } finally {
        voteLoading[tagId] = false;
    }
};
</script>