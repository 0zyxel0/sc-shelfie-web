// server/api/tags/vote.post.ts
import { createError, defineEventHandler, getCookie, readBody } from "h3";
import qs from "qs";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");
  const body = await readBody(event); // Expected: { tagId: number, voteType: 'upvote' | 'downvote' }
  console.log("BFF - Vote POST body:", body);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized." });
  }

  const userId = event.context.user?.id; // From auth.global.ts middleware
  if (!userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: User ID not available." });
  }

  const { tagId, voteType } = body;
  console.log(`BFF - User ${userId} voting on tag ${tagId} with voteType ${voteType}`);
  if (!tagId || !["upvote", "downvote"].includes(voteType)) {
    throw createError({ statusCode: 400, statusMessage: "Bad Request: Missing tagId or invalid voteType." });
  }

  const config = useRuntimeConfig();
  const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  try {
    // 1. Check if user has already voted on this tag
    const query = qs.stringify(
      { filters: { user: { id: { $eq: userId } } }, itag: { documentId: { $eq: tagId } } },
      { encodeValuesOnly: true }
    );
    const existingVoteResponse = await $fetch(`${strapiUrl}/api/user-tag-votes?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const existingVote = existingVoteResponse.data[0]; // Strapi v4 returns `data` array

    let voteChange = 0; // -1 for downvote, +1 for upvote
    let newTagVoteCount = 0; // To store the updated voteCount

    if (existingVote) {
      // User has voted before
      if (existingVote.voteType === voteType) {
        // Same vote, so undo it (toggle off)
        voteChange = voteType === "upvote" ? -1 : 1; // Subtract 1 if was upvote, add 1 if was downvote
        await $fetch(`${strapiUrl}/api/user-tag-votes/${existingVote.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`BFF - Deleted existing ${existingVote.voteType} vote for user ${userId} on tag ${tagId}`);
      } else {
        // Different vote, so change it (upvote -> downvote or vice-versa)
        voteChange = voteType === "upvote" ? 2 : -2; // -1 (for old) + 1 (for new) -> total 2 or -2
        await $fetch(`${strapiUrl}/api/user-tag-votes/${existingVote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: { data: { voteType: voteType } },
        });
        console.log(`BFF - Updated vote from ${existingVote.voteType} to ${voteType} for user ${userId} on tag ${tagId}`);
      }
    } else {
      // No existing vote, so create a new one
      voteChange = voteType === "upvote" ? 1 : -1;
      await $fetch(`${strapiUrl}/api/user-tag-votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: {
          data: {
            user: userId,
            itag: tagId,
            voteType: voteType,
          },
        },
      });
      console.log(`BFF - Created new ${voteType} vote for user ${userId} on tag ${tagId}`);
    }

    // 2. Update the ITag's global voteCount
    // First, get the current tag to update its voteCount
    const currentTagResponse = await $fetch(`${strapiUrl}/api/itags/${tagId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const currentTag = currentTagResponse;

    if (!currentTag) {
      throw createError({ statusCode: 404, statusMessage: "Tag not found." });
    }

    newTagVoteCount = (currentTag.voteCount || 0) + voteChange;

    await $fetch(`${strapiUrl}/api/itags/${tagId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: { voteCount: newTagVoteCount },
    });

    return {
      status: "success",
      tagId: tagId,
      newVoteCount: newTagVoteCount,
      userVoteStatus: voteChange === 0 ? null : voteType, // Return current vote status after toggle
    };
  } catch (e: any) {
    console.error("BFF - Error handling tag vote:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to process vote.",
    });
  }
});
