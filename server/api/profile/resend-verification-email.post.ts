// server/api/profile/resend-verification-email.post.ts
import { createError, defineEventHandler, getCookie } from 'h3';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token');

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: No authentication token found.',
    });
  }

  try {
    const config = useRuntimeConfig();
    const strapiUrl = config.strapi?.url || process.env.STRAPI_URL;

    if (!strapiUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error: Strapi URL not defined in runtimeConfig or environment.',
      });
    }

    // Strapi's endpoint for resending verification email
    await $fetch(`${strapiUrl}/api/users/send-email-confirmation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Typically no body is needed for this Strapi endpoint
    });

    return { status: 'success', message: 'Verification email sent.' };
  } catch (e: any) {
    console.error('BFF - Error resending verification email from Strapi:', e);
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || 'Failed to resend verification email.',
    });
  }
});