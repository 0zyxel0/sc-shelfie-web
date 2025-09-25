// server/api/profile/update.put.ts
import { createError, defineEventHandler, getCookie, readBody } from "h3";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");
  const body = await readBody(event); // The payload for Strapi

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: No authentication token found.",
    });
  }

  // Strapi expects the user ID for updates, which we don't have directly in `event.context.user`
  // if `auth.global.ts` only decodes the token.
  // We need to fetch the user ID from Strapi, or ideally, the client sends it.
  // For simplicity here, we'll assume the `body` contains the user ID as `id`
  // or that `event.context.user.id` from `auth.global.ts` is available AND VERIFIED.
  // A more robust solution might fetch the `me` endpoint first to get the ID.

  // Reusing `event.context.user` from auth.global.ts middleware if available and trusted.
  // Make sure your auth.global.ts populates event.context.user with `id`.
  const userId = event.context.user?.id;
  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: User ID not available for update.",
    });
  }

  try {
    const config = useRuntimeConfig();
    const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_API_BASE;
    if (!strapiUrl) {
      throw createError({ statusCode: 500, statusMessage: "Server config error." });
    }

    // Strapi's `/api/users/:id` endpoint expects a specific structure for updates
    // The `body` from client should contain fields like `displayName`, `birthDate`, `profilePicture` (id).
    const response = await $fetch(`${strapiUrl}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body, // Forward the client's payload directly
    });

    return response;
  } catch (e: any) {
    console.error("BFF - Error updating user profile on Strapi:", e.response?._data || e.message);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Failed to update user profile.",
    });
  }
});
