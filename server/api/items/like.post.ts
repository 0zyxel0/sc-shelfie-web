// server/api/items/like.post.ts
import { createError, defineEventHandler, getCookie, readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'auth_token');
    const currentUser = event.context.user;

    if (!token || !currentUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    // The client only needs to send the numerical ID of the item being liked/unliked.
    const { itemId } = await readBody(event);

    if (!itemId) {
        throw createError({ statusCode: 400, statusMessage: 'Item ID is required.' });
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        // Step 1: Fetch the current item from Strapi to get the real list of likes.
        const itemResponse = await $fetch<{ data: any }>(`${strapiUrl}/api/items/${itemId}?populate=likedBy`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Extract the array of user IDs who currently like the item.
        const currentLikes = (itemResponse.data?.attributes?.likedBy?.data || []).map(u => u.id);

        // Step 2: Determine the new state.
        const isAlreadyLiked = currentLikes.includes(currentUser.id);
        
        const newLikes = isAlreadyLiked
            ? currentLikes.filter(id => id !== currentUser.id) // Unlike: remove current user
            : [...currentLikes, currentUser.id];              // Like: add current user

        // Step 3: Update the item in Strapi with the new list of likes.
        await $fetch(`${strapiUrl}/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: {
                data: {
                    likedBy: newLikes
                }
            }
        });

        // Return a simple success message. The client's optimistic update will handle the UI.
        return { success: true };

    } catch (e: any) {
        console.error('BFF - Error toggling like:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to update like status.',
        });
    }
});