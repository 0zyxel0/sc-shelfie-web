// server/api/auth/register.post.ts

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig(event);

  // --- 1. Log the variables to see what the server is reading ---
  console.log("BFF - Registration attempt started.");
  console.log(`BFF - STRAPI_URL read as: ${config.public.strapi.url}`);
  console.log(`BFF - NUXT_PUBLIC_SITE_URL read as: ${config.publicSiteUrl}`);

  try {
    // --- 2. Validate environment variables explicitly ---
    if (!config.public.strapi.url || !config.publicSiteUrl) {
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
      // Strapi's registration endpoint is slightly different from login
      response = await $fetch<{ jwt: string; user: any }>(`${config.public.strapi.url}/api/auth/local/register`, {
        method: "POST",
        body: {
          username: body.username, // Registration requires a username
          email: body.email,
          password: body.password,
        },
      });
    } catch (e: any) {
      console.error("BFF - Error fetching from Strapi during registration:", e.data || e.message);
      // Re-throw Strapi's specific error message (e.g., "Email is already taken")
      throw createError({
        statusCode: e.statusCode || 400, // Default to 400 for bad request errors
        statusMessage: e.data?.error?.message || "Registration failed.",
      });
    }

    // --- 5. Set the cookie to automatically log the user in ---
    const isProduction = process.env.NODE_ENV === "production";

    setCookie(event, "auth_token", response.jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      domain: isProduction ? siteUrl.hostname.replace("www.", ".") : undefined,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log(`BFF - Registration successful for user: ${response.user.username}. Cookie set.`);
    return { user: response.user };
  } catch (e: any) {
    // This is a final catch-all. The more specific errors above should trigger first.
    console.error("BFF - Generic error in registration endpoint:", e.message);
    // Return the status code and message from the error that was thrown inside the try block
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "An unexpected error occurred during registration.",
    });
  }
});
