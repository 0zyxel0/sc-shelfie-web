// server/api/items/[documentId].get.ts
import { createError, defineEventHandler, getRouterParams } from "h3";
import qs from "qs";

// A helper to flatten Strapi's nested data structure
const flattenAttributes = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    ...data,
  };
};

export default defineEventHandler(async (event) => {
  const { documentId } = getRouterParams(event);

  if (!documentId) {
    throw createError({ statusCode: 400, statusMessage: "Document ID is required." });
  }

  const config = useRuntimeConfig();
  const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  try {
    // --- Fetch Core Item Data ---
    const itemQuery = qs.stringify(
      {
        filters: { documentId: { $eq: documentId } },
        // Populate all relations for the main item
        populate: ["user", "userImages", "manufacturer", "character", "series", "categories", "itags", "likedBy"],
      },
      { encodeValuesOnly: true }
    );

    const itemResponse = await $fetch(`${strapiUrl}/api/items?${itemQuery}`);

    if (!itemResponse.data || itemResponse.data.length === 0) {
      throw createError({ statusCode: 404, statusMessage: "Item not found" });
    }

    let item = flattenAttributes(itemResponse.data[0]);

    // --- Flatten nested relations for easier client consumption ---
    item.user = flattenAttributes(item.user);
    item.manufacturer = flattenAttributes(item.manufacturer);
    item.character = flattenAttributes(item.character);
    item.series = flattenAttributes(item.series);
    item.categories = item.categories?.map(flattenAttributes) || [];
    item.itags = item.itags?.map(flattenAttributes) || [];
    item.likedBy = item.likedBy?.map(flattenAttributes) || [];
    item.userImages = item.userImages?.map(flattenAttributes) || [];

    // --- Fetch Comments for the Item ---
    const commentQuery = qs.stringify(
      {
        filters: { item: { documentId: { $eq: item.documentId } } }, // Filter by the numeric item ID
        populate: { user: { populate: "profilePicture" } },
        sort: "createdAt:desc",
      },
      { encodeValuesOnly: true }
    );

    const commentsResponse = await $fetch(`${strapiUrl}/api/comments?${commentQuery}`);

    const comments = (commentsResponse.data || []).map((comment) => {
      const flatComment = flattenAttributes(comment);
      flatComment.user = flattenAttributes(flatComment.user);
      if (flatComment.user) {
        flatComment.user.profilePicture = flattenAttributes(flatComment.user.profilePicture);
      }
      return flatComment;
    });

    // Return a combined object with both item and comments
    return {
      item,
      comments,
    };
  } catch (e: any) {
    console.error("BFF - Error fetching item details:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to fetch item details.",
    });
  }
});
