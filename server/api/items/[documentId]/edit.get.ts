// server/api/items/[documentId]/edit.get.ts
import { createError, defineEventHandler, getRouterParams, getCookie } from 'h3';
import qs from 'qs';

const flattenAttributes = (data) => {
    if (!data) return null;
    return {
        id: data.id,
        ...data
    };
};

export default defineEventHandler(async (event) => {
    const { documentId } = getRouterParams(event);
    const token = getCookie(event, 'auth_token');
    const currentUser = event.context.user;

    if (!token || !currentUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    if (!documentId) {
        throw createError({ statusCode: 400, statusMessage: 'Document ID is required.' });
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        const query = qs.stringify({
            filters: { documentId: { $eq: documentId } },
            populate: ['user', 'manufacturer', 'character', 'series', 'categories', 'itags']
        }, { encodeValuesOnly: true });

        const { data: responseData } = await $fetch<{ data: any[] }>(`${strapiUrl}/api/items?${query}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!responseData || responseData.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Item not found.' });
        }

        const item = flattenAttributes(responseData[0]);

        // --- SECURITY CHECK: Verify Ownership ---
        if (item.user?.id !== currentUser.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this item.' });
        }

        // Flatten nested relations for easier client consumption
        item.manufacturer = item.manufacturer ? flattenAttributes(item.manufacturer) : null;
        item.character = item.character ? flattenAttributes(item.character) : null;
        item.series = item.series ? flattenAttributes(item.series) : null;
        item.categories = item.categories?.map(flattenAttributes) || [];
        item.itags = item.itags?.map(flattenAttributes) || [];

        return item; // Return the single, verified, and flattened item object

    } catch (e: any) {
        // Re-throw existing createError calls (like 403, 404)
        if (e.statusCode) throw e;
        
        console.error('BFF - Error fetching item for edit:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to fetch item for editing.',
        });
    }
});