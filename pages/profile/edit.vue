<template>
  <div class="bg-gray-100 min-h-screen">
    <!-- Loading and Error States -->
    <div v-if="pending" class="text-center py-20 text-gray-500">Loading your profile for editing...</div>
    <div v-else-if="error || !profileData" class="text-center py-20">
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
                <input type="text" id="username" :value="profileData.username" disabled class="form-input mt-1 bg-gray-100 cursor-not-allowed">
              </div>

              <!-- Email & Verification Status -->
              <div class="mt-6">
                <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                <input type="email" id="email" :value="profileData.email" disabled class="form-input mt-1 bg-gray-100 cursor-not-allowed">

                <div v-if="!profileData.emailVerified" class="mt-2 text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md">
                  Your email is not verified.
                  <button type="button" class="font-medium underline hover:text-yellow-900">Resend verification email</button>
                </div>
              </div>

              <!-- Birth Date -->
              <div class="mt-6">
                <label for="birthDate" class="block text-sm font-medium text-gray-700">Birth Date</label>
                <input v-model="form.birthDate" type="date" id="birthDate" required class="form-input mt-1">
                <p class="mt-1 text-xs text-gray-500">Used for age verification. You must be at least 18 years old to view NSFW contents.</p>
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
import qs from 'qs';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Account Settings | Shelfie' });

const { fetchUser } = useStrapiAuth();
const token = useStrapiToken();
const config = useRuntimeConfig();
const router = useRouter();

// --- 1. Fetch FRESH user data for this page ---
const { data: profileData, pending, error } = await useAsyncData(
  'profile-edit-data',
  async () => {
    if (!token.value) return null;
    const query = qs.stringify({ populate: 'profilePicture' });
    return await $fetch(`${config.public.strapi.url}/api/users/me?${query}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
  }
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
watch(profileData, (freshUser) => {
  if (freshUser) {
    form.displayName = freshUser.displayName || '';
    form.birthDate = freshUser.birthDate ? new Date(freshUser.birthDate).toISOString().split('T')[0] : '';

    if (freshUser.profilePicture?.url) {
      imagePreviewUrl.value = config.public.strapi.url + freshUser.profilePicture.url;
    }
  }
}, { immediate: true }); // `immediate: true` runs the watcher as soon as the data is available

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

  if (age < 13) {
    ageError.value = 'You must be at least 13 years old to use this service.';
  } else {
    ageError.value = null;
  }
});

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

  loading.value = true;
  errorMessage.value = null;
  const strapiUrl = config.public.strapi.url;

  try {
    const payload = {
      displayName: form.displayName,
      birthDate: form.birthDate,
    };

    if (profilePictureFile.value) {
      const formData = new FormData();
      formData.append('files', profilePictureFile.value);
      const [uploadedFile] = await $fetch(`${strapiUrl}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: formData,
      });
      payload.profilePicture = uploadedFile.id;
    }

    await $fetch(`${strapiUrl}/api/users/${profileData.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` },
      body: JSON.stringify(payload),
    });

    await fetchUser(); // This updates the global state for other pages
    router.push('/profile');

  } catch (e) {
    errorMessage.value = "Failed to update profile. Please try again.";
    console.error("Profile update error:", e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.form-input {
  @apply block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500;
}
</style>