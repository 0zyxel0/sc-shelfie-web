// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
    const user = useStrapiUser();
  
    // If the user is not logged in and is trying to access a protected page,
    // redirect them to the auth page.
    if (!user.value) {
      return navigateTo('/auth');
    }
  });