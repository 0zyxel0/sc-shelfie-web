import jwt from "jsonwebtoken"

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token")
  if (!token) return

  try {
    const decoded = jwt.decode(token) as any
    event.context.user = decoded
  } catch (e) {
    // Invalid token, clear it
    deleteCookie(event, "auth_token")
  }
})
