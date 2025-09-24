// middleware/auth.ts
// IMPORTANT: This middleware should only be defined if you want client-side route protection.
// For routes that MUST have a user and rely on SSR, you might prefer to handle redirects
// directly in the page's setup or layout, as `defineNuxtRouteMiddleware` can run client-only.

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, fetchUser, isLoading } = useAuthUser();

  // If user is null on the client, try to fetch it from the server
  // This is crucial for hydration and client-side navigation.
  if (!user.value && !isLoading.value) {
    await fetchUser(); // Attempt to fetch user data from the BFF endpoint
  }
  
   const allowedRoutes = ['/premium/success', '/premium/cancelled'];
  if (allowedRoutes.includes(to.path)) {
    return; // Do not redirect, let the page handle its logic.
  }

  // After attempting to fetch, check if a user is available
  if (!user.value) {
    // If the user is not logged in and is trying to access a protected page,
    // redirect them to the auth page.
    console.log(`Auth middleware: User not found, redirecting to /auth from ${to.path}`);
    return navigateTo('/auth');
  }

  console.log(`Auth middleware: User found for ${to.path}`);
});