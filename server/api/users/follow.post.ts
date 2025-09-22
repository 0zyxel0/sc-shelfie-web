// server/api/users/follow.post.ts
import { createError, defineEventHandler, getCookie, readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'auth_token');
    const currentUser = event.context.user;

    if (!token || !currentUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized. You must be logged in to follow users.' });
    }

    const { userIdToFollow } = await readBody(event);

    if (!userIdToFollow) {
        throw createError({ statusCode: 400, statusMessage: 'User ID to follow is required.' });
    }

    if (userIdToFollow === currentUser.id) {
        throw createError({ statusCode: 400, statusMessage: 'You cannot follow yourself.' });
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        // Step 1: Fetch the current user's "following" list from Strapi to get the current state.
        const { following } = await $fetch<{ following: { id: number }[] }>(`${strapiUrl}/api/users/me?populate=following`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const currentFollowingIds = (following || []).map(u => u.id);
        const isAlreadyFollowing = currentFollowingIds.includes(userIdToFollow);

        // Step 2: Determine the new "following" list.
        const newFollowingIds = isAlreadyFollowing
            ? currentFollowingIds.filter(id => id !== userIdToFollow) // Unfollow
            : [...currentFollowingIds, userIdToFollow];              // Follow

        // Step 3: Update the current user's profile with the new list.
        await $fetch(`${strapiUrl}/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: {
                following: newFollowingIds // Strapi accepts an array of numerical IDs for relations
            }
        });

        // Return the new state to the client for UI updates.
        return {
            isFollowing: !isAlreadyFollowing, // The new "isFollowing" state
            followersCount: 0 // This would require another fetch, so we'll let the client handle optimistic updates
        };

    } catch (e: any) {
        console.error('BFF - Error in follow/unfollow action:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to follow or unfollow user.',
        });
    }
});