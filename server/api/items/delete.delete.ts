// server/api/items/delete.delete.ts
import { createError, defineEventHandler, getCookie, readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'auth_token');
    const currentUser = event.context.user;

    if (!token || !currentUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { itemId } = await readBody(event); // Client will send numerical itemId

    if (!itemId) {
        throw createError({ statusCode: 400, statusMessage: 'Item ID is required for deletion.' });
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        // --- SECURITY CHECK: Verify Ownership before deleting ---
        const { data: existingItem } = await $fetch<{ data: any }>(`${strapiUrl}/api/items/${itemId}?populate=user`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (existingItem?.user?.id !== currentUser.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this item.' });
        }

        // --- Perform the deletion ---
        await $fetch(`${strapiUrl}/api/items/${itemId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        return { success: true };
    } catch (e: any) {
        if (e.statusCode) throw e;
        console.error('BFF - Error deleting item:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to delete item.',
        });
    }
});