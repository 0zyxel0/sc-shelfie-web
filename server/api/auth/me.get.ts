// server/api/auth/me.get.ts
import { createError, defineEventHandler, getCookie } from 'h3';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');

  // If there's no token, the user is not authenticated. Return null.
  // This is a valid, expected state, not an error.
  if (!token) {
    return null;
  }

  // Our global auth middleware (`/server/middleware/auth.global.ts`) should have already
  // decoded the token and placed the user payload in `event.context.user`.
  const user = event.context.user;

  if (!user) {
    // This case might happen if the token is present but invalid (e.g., expired, malformed).
    // The middleware might have tried to decode it and failed.
    // We can treat this as "not logged in" and return null.
    // Or, for stricter security, you could throw an error. Returning null is often better for the UI.
    return null;
  }

  // --- IMPORTANT ENHANCEMENT ---
  // The `event.context.user` from `jwt.decode` is UNVERIFIED.
  // For a critical "who am I" endpoint, it's best practice to make a quick call
  // to Strapi to get the FRESH and VERIFIED user data.
  const config = useRuntimeConfig();
  const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;
  if (!strapiUrl) { throw createError({ statusCode: 500, statusMessage: 'Server configuration error.' }); }
  
  try {
    const freshUser = await $fetch(`${strapiUrl}/api/users/me?fields=*&populate=role`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    // Return the fresh, verified user data from Strapi.
    return freshUser;
  } catch (e) {
    // If the token is invalid on Strapi's end (e.g., expired), it will error out.
    // In this case, the user is effectively logged out.
    console.warn('BFF - /api/auth/me: Token validation failed against Strapi.', e.data?.error?.message);
    deleteCookie(event, 'auth_token'); // Clean up the bad cookie
    return null;
  }
});