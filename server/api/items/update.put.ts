// server/api/items/update.put.ts
import { createError, defineEventHandler, getCookie, readBody } from 'h3';
import qs from 'qs';

// Re-using the findOrCreate helper from our create endpoint
const findOrCreate = async (endpoint, name, strapiUrl, token) => {
    if (!name?.trim()) return null;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const query = qs.stringify({ filters: { name: { $eqi: name.trim() } }, fields: ['id'] }, { encodeValuesOnly: true });
    try {
        const { data: existing } = await $fetch(`${strapiUrl}/api/${endpoint}?${query}`, { headers });
        if (existing?.[0]?.id) return existing[0].id;
        const { data: created } = await $fetch(`${strapiUrl}/api/${endpoint}`, { method: 'POST', headers, body: { data: { name: name.trim() } } });
        return created?.id;
    } catch (e) {
        console.error(`BFF - Error in findOrCreate for ${endpoint} with name "${name}":`, e);
        return null;
    }
};

export default defineEventHandler(async (event) => {
    const token = getCookie(event, 'auth_token');
    const currentUser = event.context.user;

    if (!token || !currentUser?.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    
    // The client will send the full form data in the body
    const form = await readBody(event);
    const { itemId, ...formData } = form; // Separate the numerical itemId from the rest of the form data

    if (!itemId) {
        throw createError({ statusCode: 400, statusMessage: 'Item ID is required for update.' });
    }

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }

    try {
        // --- SECURITY CHECK: Verify Ownership before updating ---
        const { data: existingItem } = await $fetch<{ data: any }>(`${strapiUrl}/api/items/${itemId}?populate=user`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (existingItem?.user?.id !== currentUser.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this item.' });
        }

        // --- Process relations (find or create) ---
        const manufacturerId = await findOrCreate('manufacturers', formData.manufacturer, strapiUrl, token);
        const characterId = await findOrCreate('characters', formData.character, strapiUrl, token);
        const seriesId = await findOrCreate('serieses', formData.series, strapiUrl, token);
        
        const categoryIds = await Promise.all((formData.categories || []).map(name => findOrCreate('categories', name, strapiUrl, token)));
        const tagIds = await Promise.all((formData.itags || []).map(name => findOrCreate('itags', name, strapiUrl, token)));

        // --- Construct final payload for Strapi ---
        const payload = {
            data: {
                name: formData.name,
                itemStatus: formData.itemStatus,
                description: formData.description,
                isPrivate: formData.isPrivate,
                purchasePrice: formData.purchasePrice,
                purchaseDate: formData.purchaseDate,
                manufacturer: manufacturerId,
                character: characterId,
                series: seriesId,
                categories: categoryIds.filter(id => id !== null),
                itags: tagIds.filter(id => id !== null),
            }
        };

        // --- Perform the update ---
        const { data: updatedItem } = await $fetch(`${strapiUrl}/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: payload
        });
        
        return { success: true, item: updatedItem };

    } catch (e: any) {
        if (e.statusCode) throw e;
        console.error('BFF - Error updating item:', e.response?._data || e.message);
        throw createError({
            statusCode: e.response?.status || 500,
            statusMessage: e.response?._data?.error?.message || 'Failed to update item.',
        });
    }
});