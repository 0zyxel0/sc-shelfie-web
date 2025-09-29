// server/api/tags/user-vote-status.get.ts
import { createError, defineEventHandler, getCookie, getQuery } from "h3";
import qs from "qs";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    // If not logged in, they can't have voted, so return null
    return { voteType: null };
  }

  const userId = event.context.user?.id;
  if (!userId) {
    // If token exists but user ID is somehow missing, treat as no vote for now
    return { voteType: null };
  }

  const { tagId } = getQuery(event);
  if (!tagId) {
    throw createError({ statusCode: 400, statusMessage: "Bad Request: Missing tagId." });
  }

  const config = useRuntimeConfig();
  const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  try {
    const query = qs.stringify(
      { filters: { user: { id: { $eq: userId } } }, itag: { documentId: { $eq: tagId } } },
      { encodeValuesOnly: true }
    );
    const response = await $fetch(`${strapiUrl}/api/user-tag-votes?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`BFF - User ${userId} vote status check for tag ${tagId}:`, response);

    const existingVote = response.data[0]; // Strapi v4 returns `data` array

    if (existingVote) {
      return { voteType: existingVote.voteType };
    } else {
      return { voteType: null };
    }
  } catch (e: any) {
    // Log error but return null to client for vote status lookup if backend fails
    console.error("BFF - Error checking user vote status:", e.response?._data || e.message);
    return { voteType: null }; // Gracefully handle errors by saying no vote found
  }
});
