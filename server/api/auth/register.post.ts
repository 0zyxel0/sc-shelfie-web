export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const response = await $fetch<{ jwt: string; user: any }>(`${process.env.STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      body,
    })

    setCookie(event, "auth_token", response.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return { user: response.user }
  } catch (e: any) {
    throw createError({
      statusCode: e.response?.status || 500,
      statusMessage: e.response?._data?.error?.message || "Registration failed",
    })
  }
})
