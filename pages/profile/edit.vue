<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">
        {{ isNewUser ? 'Complete Your Profile' : 'Edit Your Profile' }}
      </h1>

      <form @submit.prevent="handleSubmit">
        <!-- Profile Picture Upload -->
        <div class="flex flex-col items-center mb-6">
          <label for="profile-picture" class="cursor-pointer">
            <img :src="imagePreviewUrl" alt="Profile Preview"
              class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 hover:border-blue-400 transition-all" />
          </label>
          <input id="profile-picture" type="file" @change="onFileChange" class="hidden" accept="image/*" />
          <p class="text-sm text-gray-500 mt-2">Click image to change</p>
        </div>

        <!-- Display Name Field -->
        <div class="mb-4">
          <label for="displayName" class="block text-gray-700 text-sm font-bold mb-2">Display Name</label>
          <input v-model="displayName" type="text" id="displayName"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required placeholder="e.g., Jane Doe" />
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="loading"
          class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300">
          {{ loading ? 'Saving...' : 'Save Profile' }}
        </button>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-red-500 text-xs italic mt-4 text-center">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' });
useHead({ title: 'Edit Profile' });

// We need to get the `fetchUser` function from useStrapiAuth
const { fetchUser } = useStrapiAuth(); // <-- ADD THIS
const user = useStrapiUser();
const token = useStrapiToken();
const config = useRuntimeConfig();
const router = useRouter();

const strapiUrl = config.public.strapi.url;

// --- Refs for the form state ---
const displayName = ref('');
const profilePictureFile = ref(null);
const imagePreviewUrl = ref('/avatar-placeholder.png');
const loading = ref(false);
const errorMessage = ref(null);

onMounted(() => {
  if (user.value) {
    displayName.value = user.value.displayName || '';
    if (user.value.profilePicture?.url) {
      imagePreviewUrl.value = strapiUrl + user.value.profilePicture.url;
    }
  }
});

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    profilePictureFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
};

const handleSubmit = async () => {
  if (!user.value) return;

  loading.value = true;
  errorMessage.value = null;

  try {
    const payload = { displayName: displayName.value };

    // --- STEP 1: UPLOAD THE IMAGE ---
    if (profilePictureFile.value) {
      const formData = new FormData();
      formData.append('files', profilePictureFile.value);

      const uploadResponse = await fetch(`${strapiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Image upload failed.');
      const uploadedFiles = await uploadResponse.json();
      payload.profilePicture = uploadedFiles[0].id;
    }

    // --- STEP 2: UPDATE THE USER ---
    const updateUserResponse = await fetch(`${strapiUrl}/api/users/${user.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(payload),
    });

    if (!updateUserResponse.ok) throw new Error('Failed to update user profile.');

    // --- SUCCESS ---
    // Manually refetch the user state to update the UI everywhere
    await fetchUser(); // <-- THIS IS THE CORRECT WAY TO REFRESH THE USER

    router.push('/profile');

  } catch (e) {
    console.error("Profile update error:", e);
    errorMessage.value = e.message || "An unexpected error occurred. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>