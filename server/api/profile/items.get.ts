// server/api/profile/items.get.ts
import { createError, defineEventHandler, getCookie, getQuery } from "h3";
import qs from "qs";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: No authentication token found.",
    });
  }

  try {
    const clientQueryParams = getQuery(event);

    // Deep copy and parse 'populate' and 'filters' if they are stringified JSON
    let paramsForStrapi = JSON.parse(JSON.stringify(clientQueryParams));

    if (typeof paramsForStrapi.populate === "string" && paramsForStrapi.populate.startsWith("{")) {
      try {
        paramsForStrapi.populate = JSON.parse(paramsForStrapi.populate);
      } catch (e) {
        console.warn("BFF - Could not JSON.parse populate string:", paramsForStrapi.populate, e);
      }
    }

    if (typeof paramsForStrapi.filters === "string" && paramsForStrapi.filters.startsWith("{")) {
      try {
        paramsForStrapi.filters = JSON.parse(paramsForStrapi.filters);
      } catch (e) {
        console.warn("BFF - Could not JSON.parse filters string:", paramsForStrapi.filters, e);
      }
    }

    const query = qs.stringify(paramsForStrapi, { encodeValuesOnly: true });

    const config = useRuntimeConfig();
    const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;

    if (!strapiUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: "Server configuration error: Strapi URL not defined in runtimeConfig or environment.",
      });
    }

    console.log("BFF - Query string sent to Strapi for /items:", query); // Add this for continued debugging
    const response = await $fetch(`${strapiUrl}/api/items?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (e: any) {
    console.error("BFF - Error fetching user items from Strapi:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to fetch user items.",
    });
  }
});
