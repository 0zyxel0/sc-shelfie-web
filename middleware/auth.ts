export default defineNuxtRouteMiddleware((to, from) => {
  const jwt = useCookie("auth_token");

  const allowedRoutes = ["/premium/success", "/premium/cancelled"];
  if (allowedRoutes.includes(to.path)) {
    return; // Do not redirect, let the page handle its logic.
  }
  // If the user is not logged in and not already on the login page
  if (!jwt.value && to.path !== "/auth") {
    return navigateTo("/auth");
  }

  // If user is logged in and trying to access the login page, redirect to home
  if (jwt.value && to.path === "/auth") {
    return navigateTo("/");
  }
});
