export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const response = await $fetch<{ jwt: string; user: any }>(`${process.env.STRAPI_URL}/api/auth/local`, {
      method: "POST",
      body: {
        identifier: body.email,
        password: body.password,
      },
    })

    // Store JWT securely in HttpOnly cookie
    setCookie(event, "auth_token", response.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Optionally return the user profile (without exposing token)
    return { user: response.user }
  } catch (e: any) {
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Login failed",
    })
  }
})
