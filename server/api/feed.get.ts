// server/api/feed.get.ts
import { createError, defineEventHandler, getCookie } from 'h3';
import qs from 'qs';

const flattenAttributes = (data) => {
    if (!data) return null;
    return {
        id: data.id,
        ...data
    };
};

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'auth_token');
    const currentUser = event.context.user;

    if (!token || !currentUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        // Step 1: Fetch the list of users the current user is following.
        // We only need the IDs, so we can make this query efficient.
        const followingQuery = qs.stringify({
            populate: {
                following: {
                    fields: ['id']
                }
            }
        }, { encodeValuesOnly: true });

        const { following } = await $fetch<{ following: { id: number }[] }>(`${strapiUrl}/api/users/me?${followingQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Add the current user's ID to the list to include their own public items in the feed.
        const userIdsToFetch = (following || []).map(u => u.id);
        userIdsToFetch.push(currentUser.id); // Also show my own items

        if (userIdsToFetch.length === 0) {
            return []; // If not following anyone, the feed is empty.
        }

        // Step 2: Fetch public items created by those users.
        const itemsQuery = qs.stringify({
            filters: {
                user: { id: { $in: userIdsToFetch } },
                isPrivate: { $eq: false } // Only public items
            },
            populate: {
                user: { populate: 'profilePicture' },
                userImages: { fields: ['url', 'name', 'alternativeText'] }
            },
            sort: 'createdAt:desc',
            'pagination[limit]': 25, // Limit the feed size
        }, { encodeValuesOnly: true });

        const { data: itemsResponse } = await $fetch<{ data: any[] }>(`${strapiUrl}/api/items?${itemsQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Step 3: Flatten the response data for easy client-side consumption.
        const flattenedItems = (itemsResponse || []).map(item => {
            const flatItem = flattenAttributes(item);
            
            flatItem.user = flattenAttributes(flatItem.user);
            if (flatItem.user?.profilePicture) {
                flatItem.user.profilePicture = flattenAttributes(flatItem.user.profilePicture);
            }

            flatItem.userImages = flatItem.userImages?.map(flattenAttributes) || [];
            
            return flatItem;
        });

        return flattenedItems;

    } catch (e: any) {
        console.error('BFF - Error fetching feed:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to fetch feed.',
        });
    }
});