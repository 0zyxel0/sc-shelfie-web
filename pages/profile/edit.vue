<template>
  <div class="bg-gray-100 min-h-screen">
    <!-- Loading and Error States -->
    <div v-if="loading || !user" class="text-center py-20 text-gray-500">Loading your profile for editing...</div>
    <div v-else-if="!user" class="text-center py-20">
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
                <input type="text" id="username" :value="user.username" disabled class="form-input mt-1 bg-gray-100 cursor-not-allowed">
              </div>

              <!-- Email & Verification Status -->
              <div class="mt-6">
                <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                <input type="email" id="email" :value="user.email" disabled class="form-input mt-1 bg-gray-100 cursor-not-allowed">

                <div v-if="!user.confirmed" class="mt-2 text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md">
                  Your email is not verified.
                  <button type="button" @click="handleResendEmail" :disabled="resendPending" class="font-medium underline hover:text-yellow-900">
                    {{ resendPending ? 'Sending...' : 'Resend verification email' }}
                  </button>
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
import { reactive, ref, watch } from 'vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Account Settings | Shelfie' });

const user = useStrapiUser();
const { update, $strapi, findOne } = useStrapi(); // Need update for user entity, and $strapi client for auth action
const client = useStrapiClient();
const router = useRouter();
const config = useRuntimeConfig();

// --- STATE ---
const form = reactive({
  displayName: '',
  birthDate: '',
});
const profilePictureFile = ref(null);
const imagePreviewUrl = ref('/avatar-placeholder.png');
const loading = ref(true); // Start loading true until form is initialized
const resendPending = ref(false);
const errorMessage = ref(null);
const ageError = ref(null);

// --- 1. Initialization: Fetch fresh user data and pre-fill form ---
// We must fetch the user data with the profilePicture populated, as `useStrapiUser`
// usually only returns a minimal JWT payload by default.

const { data: freshUserData } = await useAsyncData(
  `user-profile-edit-${user.value?.id}`,
  async () => {
    if (!user.value?.id) return null;
    // Find the user entity and populate the profile picture
    return await findOne('users', user.value.id, {
      populate: ['profilePicture']
    });
  },
  { server: true, watch: [() => user.value?.id] }
);

watch(freshUserData, (freshUser) => {
  if (freshUser) {
    // Assume user data is sufficiently flat for direct access (as per V5 assumption)
    form.displayName = freshUser.displayName || '';
    form.birthDate = freshUser.birthDate ? new Date(freshUser.birthDate).toISOString().split('T')[0] : '';

    // --- Profile Picture URL Prefixing ---
    if (freshUser.profilePicture?.url) {
      // Already fully flattened media object
      imagePreviewUrl.value = freshUser.profilePicture.url.startsWith('http')
        ? freshUser.profilePicture.url
        : config.public.strapi.url + freshUser.profilePicture.url;
    }
    loading.value = false;
  }
}, { immediate: true });


// --- 2. Age Verification Logic ---
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

  if (age < 13) {
    ageError.value = 'You must be at least 13 years old to use this service.';
  } else {
    ageError.value = null;
  }
}, { immediate: true });

// --- 3. File Handler ---
const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    profilePictureFile.value = file;
    // Revoke old URL if necessary, though Vue handles reactivity well
    if (imagePreviewUrl.value && imagePreviewUrl.value !== '/avatar-placeholder.png') {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
};

// --- 4. Submission Logic (Combined Multipart Update) ---
const handleUpdate = async () => {
  if (ageError.value) {
    errorMessage.value = "Please correct the errors before saving.";
    return;
  }
  if (!user.value?.id) {
    errorMessage.value = "User not logged in or ID missing.";
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    // A. Construct JSON Payload
    const jsonPayload = {
      displayName: form.displayName,
      birthDate: form.birthDate,
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(jsonPayload)); // Append JSON entity data

    // B. Handle File Upload (only if a new file is selected)
    if (profilePictureFile.value) {
      // files.<relationName>: 'profilePicture' is the name of the relation field on the User entity
      formData.append('files.profilePicture', profilePictureFile.value);
    }
    // Note: If no file is selected, the file field is skipped, and the JSON data updates the text fields.

    // C. Execute Multipart PUT request to update the user entity
    const updatedUser = await client(`/users/${user.value.id}`, {
      method: 'PUT',
      body: formData,
    });

    // D. Success Handling: Update global user state (assuming useStrapiUser has a refresh mechanism)
    // For now, we manually refresh the data fetched on this page and rely on the next page load.
    // If you have a global refresh function on useStrapiUser (e.g., `refreshUser`), call it here.

    router.push('/profile'); // Redirect to view profile

  } catch (e) {
    errorMessage.value = e.response?.data?.error?.message || "Failed to update profile. Please try again.";
    console.error("Profile update error:", e.response?.data || e);
  } finally {
    loading.value = false;
  }
};

// --- 5. Resend Email Logic (Auth Service) ---
const handleResendEmail = async () => {
  if (resendPending.value || !user.value?.email) return;

  resendPending.value = true;
  errorMessage.value = null;

  try {
    // Strapi Auth service endpoint for email confirmation
    await $strapi.request({
      url: '/auth/send-email-confirmation',
      method: 'POST',
      body: { email: user.value.email }
    });
    alert('A new verification email has been sent! Check your inbox.');

  } catch (e) {
    errorMessage.value = 'Failed to send verification email. Please try again later.';
    console.error("Resend verification email error:", e);
  } finally {
    resendPending.value = false;
  }
};
</script>

<style scoped>
.form-input {
  @apply block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500;
}
</style>