// server/api/items/comment.post.ts
import { createError, defineEventHandler, getCookie, readBody } from "h3";
import qs from "qs";

const flattenAttributes = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    ...data.attributes,
  };
};

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");
  const currentUser = event.context.user;

  if (!token || !currentUser?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { itemId, content } = await readBody(event); // Receives numerical id

  if (!itemId || !content?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Item ID and comment content are required." });
  }

  const config = useRuntimeConfig();
  const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: "Server configuration error." });
  }

  try {
    const payload = {
      data: {
        content,
        item: itemId, // Relate using numerical ID
        user: currentUser.id,
      },
    };

    const createdCommentResponse = await $fetch<{ data: any }>(`${strapiUrl}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: payload,
    });

    const newCommentId = createdCommentResponse.data.documentId;

    const query = qs.stringify(
      {
        populate: { user: { populate: "profilePicture" } },
      },
      { encodeValuesOnly: true }
    );

    const populatedCommentResponse = await $fetch<{ data: any }>(`${strapiUrl}/api/comments/${newCommentId}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const flatComment = flattenAttributes(populatedCommentResponse.data);
    if (flatComment.user?.data) {
      flatComment.user = flattenAttributes(flatComment.user.data);
      if (flatComment.user.profilePicture?.data) {
        flatComment.user.profilePicture = flattenAttributes(flatComment.user.profilePicture.data);
      }
    }

    return flatComment;
  } catch (e: any) {
    console.error("BFF - Error posting comment:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to post comment.",
    });
  }
});
