<template>
  <div class="bg-gray-100 min-h-screen">
    <!-- Loading and Error States -->
    <div v-if="pending || userLoading" class="text-center py-20 text-gray-500">Loading your profile for editing...</div>
    <div v-else-if="error || !user" class="text-center py-20">
      <h2 class="text-xl font-semibold text-red-600">Could not load your profile</h2>
      <p class="text-gray-500">Please try logging in again.</p>
    </div>

    <!-- Main Content -->
    <div v-else class="container mx-auto py-12 px-4 max-w-4xl">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Account Settings</h1>
      <p class="text-gray-500 mb-8">Manage your public profile and account details.</p>

      <div class="bg-white rounded-lg shadow-xl overflow-hidden">
        <form @submit.prevent="handleUpdate">
          <div class="divide-y divide-gray-200 lg:grid lg:grid-cols-3 lg:divide-y-0 lg:divide-x">

            <!-- Column 1: Profile Information -->
            <div class="py-6 px-4 sm:p-6 lg:pb-8">
              <div>
                <h2 class="text-lg leading-6 font-medium text-gray-900">Profile</h2>
                <p class="mt-1 text-sm text-gray-500">This information will be displayed publicly.</p>
              </div>

              <!-- Profile Picture Upload -->
              <div class="mt-6 flex flex-col items-center">
                <label for="profile-picture" class="cursor-pointer">
                  <img :src="imagePreviewUrl" alt="Profile Preview" class="w-24 h-24 rounded-full object-cover border-4 border-gray-200 hover:border-blue-400 transition-all" />
                </label>
                <input id="profile-picture" type="file" @change="onFileChange" class="hidden" accept="image/*" />
                <p class="text-sm text-gray-500 mt-2">Click image to change</p>
              </div>

              <!-- Display Name -->
              <div class="mt-6">
                <label for="displayName" class="block text-sm font-medium text-gray-700">Display Name</label>
                <input v-model="form.displayName" type="text" id="displayName" required class="form-input mt-1">
              </div>
            </div>

            <!-- Column 2: Account Information -->
            <div class="py-6 px-4 sm:p-6 lg:col-span-2">
              <div>
                <h2 class="text-lg leading-6 font-medium text-gray-900">Account Details</h2>
                <p class="mt-1 text-sm text-gray-500">Your private account information.</p>
              </div>

              <!-- Username (Read-only) -->
              <div class="mt-6">
                <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
                <!-- Use `user.username` from the global user state -->
                <input type="text" id="username" :value="user.username" disabled class="form-input mt-1 bg-gray-100 cursor-not-allowed">
              </div>

              <!-- Email & Verification Status -->
              <div class="mt-6">
                <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                <!-- Use `user.email` from the global user state -->
                <input type="email" id="email" :value="user.email" disabled class="form-input mt-1 bg-gray-100 cursor-not-allowed">

                <div v-if="!user.emailVerified" class="mt-2 text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md">
                  Your email is not verified.
                  <!-- Re-using `resendEmail` from useAuthUser or define locally if it has specific logic -->
                  <button type="button" @click="handleResendEmail" class="font-medium underline hover:text-yellow-900">Resend verification email</button>
                </div>
              </div>

              <!-- Birth Date -->
              <div class="mt-6">
                <label for="birthDate" class="block text-sm font-medium text-gray-700">Birth Date</label>
                <input v-model="form.birthDate" type="date" id="birthDate" required class="form-input mt-1">
                <p class="mt-1 text-xs text-gray-500">Used for age verification. You must be at least 13 years old to use this service.</p>
                <p v-if="ageError" class="text-xs text-red-600 mt-1">{{ ageError }}</p>
              </div>

            </div>
          </div>

          <!-- Form Actions Footer -->
          <div class="py-4 px-4 flex justify-end sm:px-6 bg-gray-50">
            <button type="submit" :disabled="loading || !!ageError" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none disabled:bg-blue-400">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
          <p v-if="errorMessage" class="text-red-500 text-center pb-4">{{ errorMessage }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// REMOVE: `qs` is now used on the server
// import qs from 'qs';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Account Settings | Shelfie' });

// Use your custom composable for auth state
const { user, isLoading: userLoading, fetchUser } = useAuthUser();
const router = useRouter();
const config = useRuntimeConfig();

// --- 1. Fetch FRESH user data for this page ---
// We'll use useAsyncData to trigger the `fetchUser` from useAuthUser.
// This ensures the global user state (`user` from useAuthUser) is fresh.
const { pending, error } = await useAsyncData(
  'profile-edit-data',
  async () => {
    // If user is not yet populated (e.g., direct navigation or refresh), fetch it.
    // The `fetchUser` from `useAuthUser` already calls `/api/profile/me`.
    // We can also pass populate options here directly if needed by the specific API route.
    if (!user.value) {
      await fetchUser(); // This will use the /api/profile/me BFF endpoint
    }
  },
  { server: true } // Ensure this runs on both client and server for SSR
);


// --- 2. Initialize form state ---
const form = reactive({
  displayName: '',
  birthDate: '',
});
const profilePictureFile = ref(null);
const imagePreviewUrl = ref('/avatar-placeholder.png'); // Default placeholder
const loading = ref(false);
const errorMessage = ref(null);
const ageError = ref(null);

// --- 3. Pre-fill the form once the fresh data is available ---
// Watch `user.value` from `useAuthUser` instead of `profileData`
watch(user, (freshUser) => {
  if (freshUser) {
    form.displayName = freshUser.displayName || '';
    form.birthDate = freshUser.birthDate ? new Date(freshUser.birthDate).toISOString().split('T')[0] : '';

    // Adjust for Strapi v4 nested structure: `profilePicture.data.attributes.url`
    if (freshUser.profilePicture?.data?.attributes?.url) {
      imagePreviewUrl.value = config.public.strapi.url + freshUser.profilePicture.data.attributes.url;
    }
  }
}, { immediate: true });

// --- 4. Age Verification Logic ---
watch(() => form.birthDate, (newDate) => {
  if (!newDate) {
    ageError.value = 'Birth date is required.';
    return;
  }
  const birthDate = new Date(newDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 13) { // Changed from 18 to 13 as per comment in template
    ageError.value = 'You must be at least 13 years old to use this service.';
  } else {
    ageError.value = null;
  }
}, { immediate: true }); // Also run on initial load

// --- 5. Event Handlers and Submission Logic ---
const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    profilePictureFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
};

const handleUpdate = async () => {
  if (ageError.value) {
    errorMessage.value = "Please correct the errors before saving.";
    return;
  }
  if (!user.value?.id) { // Ensure user ID is available
    errorMessage.value = "User not logged in or ID missing.";
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    const payload = {
      displayName: form.displayName,
      birthDate: form.birthDate,
    };

    if (profilePictureFile.value) {
      const formData = new FormData();
      formData.append('files', profilePictureFile.value); // 'files' is Strapi's default field name for uploads
      // Call your BFF upload endpoint
      const [uploadedFile] = await $fetch('/api/upload', {
        method: 'POST',
        body: formData, // $fetch handles Content-Type for FormData
      });
      payload.profilePicture = uploadedFile.id; // Strapi expects the ID of the uploaded file
    }

    // Call your BFF update endpoint
    await $fetch('/api/profile/update', {
      method: 'PUT',
      // No need for 'Content-Type': 'application/json' here, $fetch adds it for plain objects
      body: payload, // Send the payload object
    });

    await fetchUser(); // IMPORTANT: Re-fetch the global user state to get updated profile data
    router.push('/profile');

  } catch (e) {
    errorMessage.value = e.data?.statusMessage || "Failed to update profile. Please try again.";
    console.error("Profile update error:", e);
  } finally {
    loading.value = false;
  }
};

const handleResendEmail = async () => {
  // You can either create a local resendStatus ref and logic similar to `auth.vue`
  // or use a resendEmail function if you add one to your `useAuthUser` composable.
  // For now, let's keep it simple and directly call the BFF route here:
  try {
    // Calling the BFF endpoint directly
    await $fetch('/api/profile/resend-verification-email', {
      method: 'POST',
    });
    alert('A new verification email has been sent!');
  } catch (e) {
    alert(e.data?.statusMessage || 'Failed to send verification email. Please try again later.');
    console.error("Resend verification email error:", e);
  }
};
</script>

<style scoped>
.form-input {
  @apply block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500;
}
</style>