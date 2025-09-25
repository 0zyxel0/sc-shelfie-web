// server/api/items.get.ts
import { createError, defineEventHandler, getCookie, getQuery } from "h3";
import qs from "qs";

export default defineEventHandler(async (event): Promise<any> => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: No authentication token found.",
    });
  }

  try {
    const clientQueryParams = getQuery(event);
    let paramsForStrapi = JSON.parse(JSON.stringify(clientQueryParams)); // Deep copy

    // --- Dynamic Populate/Filters Parsing ---
    if (typeof paramsForStrapi.populate === "string" && paramsForStrapi.populate.startsWith("{")) {
      try {
        paramsForStrapi.populate = JSON.parse(paramsForStrapi.populate);
      } catch (e) {
        /* warn */
      }
    }
    if (typeof paramsForStrapi.filters === "string" && paramsForStrapi.filters.startsWith("{")) {
      try {
        paramsForStrapi.filters = JSON.parse(paramsForStrapi.filters);
      } catch (e) {
        /* warn */
      }
    }
    if (paramsForStrapi.filters?.user?.id?.$eq) {
      paramsForStrapi.filters.user.id.$eq = Number(paramsForStrapi.filters.user.id.$eq);
    }
    // --- FIX: LOOK FOR THE NESTED pagination OBJECT ---
    if (paramsForStrapi.pagination?.pageSize) {
      paramsForStrapi.pagination.pageSize = Number(paramsForStrapi.pagination.pageSize);
    }

    // Stringify the now-consistent nested object into square-bracket notation for Strapi
    const query = qs.stringify(paramsForStrapi, { encodeValuesOnly: true });

    const config = useRuntimeConfig();
    const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
    if (!strapiUrl) {
      throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
    }

    console.log("BFF - Query string sent to Strapi for /api/items:", query);
    const response = await $fetch(`${strapiUrl}/api/items?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (e: any) {
    console.error("BFF - Error fetching items from Strapi:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to fetch items.",
    });
  }
});
