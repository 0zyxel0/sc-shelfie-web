// server/api/calendar.get.ts
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
    const currentUser = await $fetch('/api/auth/me', { headers: event.node.req.headers });

    if (!token || !currentUser?.id) {
        // Return an empty array if not logged in, as this is an expected state for this page.
        return [];
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        // Get the start of today's date to filter out past pre-orders.
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const query = qs.stringify({
            filters: {
                user: { id: { $eq: currentUser.id } },
                itemStatus: { $eq: 'Pre-ordered' },
                // `$gte` means "greater than or equal to"
                purchaseDate: { $gte: todayISO },
            },
            populate: {
                userImages: { fields: ['url'] } // Only need the URL for the image
            },
            sort: 'purchaseDate:asc', // Sort by the closest release date first
            'pagination[pageSize]': 500,
        }, { encodeValuesOnly: true });

        const { data: itemsResponse } = await $fetch<{ data: any[] }>(`${strapiUrl}/api/items?${query}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Flatten the data for easier client-side consumption
        const flattenedItems = (itemsResponse || []).map(item => {
            const flatItem = flattenAttributes(item);
            flatItem.userImages = flatItem.userImages?.map(flattenAttributes) || [];
            return flatItem;
        });

        return flattenedItems;

    } catch (e: any) {
        console.error('BFF - Error fetching calendar pre-orders:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to fetch pre-orders.',
        });
    }
});