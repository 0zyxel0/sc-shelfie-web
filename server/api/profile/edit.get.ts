// server/api/profile/edit.get.ts
import { createError, defineEventHandler, getCookie, getQuery } from 'h3';
import qs from 'qs';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: No authentication token found.',
    });
  }

  try {
    const clientQueryParams = getQuery(event);
    // Ensure populate is an object if it comes as a stringified JSON
    let paramsForStrapi = JSON.parse(JSON.stringify(clientQueryParams));
    if (typeof paramsForStrapi.populate === 'string' && paramsForStrapi.populate.startsWith('{')) {
      try { paramsForStrapi.populate = JSON.parse(paramsForStrapi.populate); } catch (e) { /* warn */ }
    }

    // Default populate for the edit page if not provided by client, or merge it
    const defaultPopulate = 'profilePicture';
    if (!paramsForStrapi.populate) {
        paramsForStrapi.populate = defaultPopulate;
    } else if (typeof paramsForStrapi.populate === 'string' && paramsForStrapi.populate !== defaultPopulate) {
        // If client sends different string populate, respect it for now, or you can force default
    }


    const query = qs.stringify(paramsForStrapi, { encodeValuesOnly: true });

    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
    if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server config error.' }); }

    const response = await $fetch(`${strapiUrl}/api/users/me?${query}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (e: any) {
    console.error('BFF - Error fetching user profile for edit from Strapi:', e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || 'Failed to fetch profile data for editing.',
    });
  }
});