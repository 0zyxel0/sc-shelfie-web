// composables/useAuthUser.ts
import { ref } from 'vue';

export function useAuthUser() {
  const user = useState('auth-user', () => null);
  const isLoading = ref(false);
  const error = ref(null);

  const fetchUser = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await $fetch('/api/auth/me', {
        method: 'GET',
      });
      user.value = response;
      return response;
    } catch (e: any) {
      console.error('Failed to fetch authenticated user:', e);
      user.value = null;
      error.value = e.data?.statusMessage || 'Failed to fetch user data.';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const logoutUser = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' });
      
      // 1. Clear the local user state immediately for instant UI feedback.
      user.value = null;
      error.value = null;
      
      // 2. CRITICAL: Clear all cached async data.
      // This will remove stale data from `useAsyncData` calls across your entire app,
      // such as the item list on `/my-shelf` or the feed on `/feed`.
      await clearNuxtData();

      console.log('User logged out and NuxtData cleared.');

    } catch (e) {
      console.error("Logout failed:", e);
      error.value = 'Logout failed.';
    }
  };

  return {
    user,
    isLoading,
    error,
    fetchUser,
    logoutUser,
  };
}