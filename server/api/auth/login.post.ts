// server/api/auth/login.post.ts (Full, Corrected & Debuggable Code)

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig(event);

  // --- 1. Log the variables to see what the server is reading ---
  console.log("BFF - Login attempt started.");
  console.log(`BFF - STRAPI_URL read as: ${config.strapi.url}`);
  console.log(`BFF - NUXT_PUBLIC_SITE_URL read as: ${config.publicSiteUrl}`);

  try {
    // --- 2. Validate environment variables explicitly ---
    if (!config.strapi.url || !config.publicSiteUrl) {
      console.error("BFF - CRITICAL ERROR: STRAPI_URL or NUXT_PUBLIC_SITE_URL is not defined in the server environment!");
      throw createError({
        statusCode: 500,
        statusMessage: "Server is misconfigured. Please contact administrator.",
      });
    }

    // --- 3. Isolate the URL parsing to catch specific errors ---
    let siteUrl;
    try {
      siteUrl = new URL(config.publicSiteUrl);
    } catch (e) {
      console.error(`BFF - CRITICAL ERROR: NUXT_PUBLIC_SITE_URL ("${config.publicSiteUrl}") is not a valid URL.`);
      throw createError({
        statusCode: 500,
        statusMessage: "Server URL configuration is invalid.",
      });
    }

    // --- 4. Isolate the Strapi fetch call ---
    let response;
    try {
      response = await $fetch<{ jwt: string; user: any }>(`${config.strapi.url}/api/auth/local`, {
        method: "POST",
        body: {
          identifier: body.email,
          password: body.password,
        },
      });
    } catch (e: any) {
      console.error("BFF - Error fetching from Strapi:", e.data || e.message);
      // Re-throw Strapi's specific error message (e.g., "Invalid identifier or password")
      throw createError({
        statusCode: e.statusCode || 401, // Default to 401 for auth errors
        statusMessage: e.data?.error?.message || "Invalid credentials.",
      });
    }

    // --- 5. Set the cookie ---
    const isProduction = process.env.NODE_ENV === "production";

    setCookie(event, "auth_token", response.jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      domain: isProduction ? siteUrl.hostname.replace("www.", ".") : undefined,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log(`BFF - Login successful for user: ${response.user.username}. Cookie set.`);
    return { user: response.user };
  } catch (e: any) {
    // This is now a final catch-all. The more specific errors above should trigger first.
    console.error("BFF - Generic error in login endpoint:", e.message);
    // Return the status code and message from the error that was thrown inside the try block
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "An unexpected error occurred during login.",
    });
  }
});
