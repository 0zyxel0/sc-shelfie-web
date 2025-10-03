// server/api/tags/sorted.get.ts
import { createError, defineEventHandler } from "h3";
import qs from "qs";

export default defineEventHandler(async (event) => {
  // No auth token needed as trending/sorted tags are typically public
  // If you need to filter or personalize based on user, retrieve token/user ID here

  const config = useRuntimeConfig();
  const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
  if (!strapiUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server configuration error: Strapi URL not defined.",
    });
  }

  try {
    const query = qs.stringify(
      {
        sort: ["voteCount:desc", "name:asc"], // Sort by voteCount descending, then name ascending
        "pagination[limit]": 50, // Limit to a reasonable number of top tags for the filter bar
        fields: ["name", "voteCount"], // Only fetch necessary fields
      },
      { encodeValuesOnly: true }
    );

    // Fetch tags from Strapi
    const response = await $fetch(`${strapiUrl}/api/i-tags?${query}`);

    // Transform the Strapi response to a flat array of tag objects
    // Each object should contain id, name, and voteCount (even if not displayed, it's the sorting key)
    return response.data.map((tag) => ({
      id: tag.id,
      name: tag.name,
      voteCount: tag.voteCount || 0, // Ensure voteCount is always a number
    }));
  } catch (e: any) {
    console.error("BFF - Error fetching sorted tags from Strapi:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to fetch sorted tags.",
    });
  }
});
