<template>
    <!-- START: Loading Modal Indicator -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <!-- Spinner -->
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
    </div>
    <!-- END: Loading Modal Indicator -->

    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">

            <!-- App Title -->
            <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">Shelfie</h1>
            <p class="text-center text-gray-500 mb-8">Your Digital Collector Shelf</p>

            <!-- Form -->
            <form @submit.prevent="handleAuth">

                <!-- Error Message Display -->
                <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span class="block sm:inline">{{ errorMessage }}</span>
                </div>

                <!-- Password Mismatch Warning -->
                <div v-if="isRegisterMode && passwordMismatch" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span class="block sm:inline">Passwords do not match.</span>
                </div>

                <!-- Username Field (Register Mode Only) -->
                <div v-if="isRegisterMode" class="mb-4">
                    <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
                    <input v-model="username" type="text" id="username" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>

                <!-- Email Field -->
                <div class="mb-4">
                    <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input v-model="email" type="email" id="email" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>

                <!-- Password Field -->
                <div class="mb-4">
                    <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input v-model="password" type="password" id="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>

                <!-- CONFIRM Password Field (New) -->
                <div v-if="isRegisterMode" class="mb-6">
                    <label for="confirm-password" class="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                    <input v-model="confirmPassword" type="password" id="confirm-password" :class="['shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline', { 'border-red-500': passwordMismatch }]" required />
                </div>

                <!-- Submit Button -->
                <div class="flex items-center justify-between">
                    <button type="submit" :disabled="isRegisterMode && passwordMismatch" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ isRegisterMode ? 'Create Account' : 'Sign In' }}
                    </button>
                </div>
            </form>

            <!-- Toggle Link -->
            <p class="text-center text-gray-600 text-sm mt-6">
                <template v-if="isRegisterMode">
                    Already have an account?
                    <a href="#" @click.prevent="isRegisterMode = false" class="font-bold text-blue-500 hover:text-blue-800">
                        Log In
                    </a>
                </template>
                <template v-else>
                    Don't have an account?
                    <a href="#" @click.prevent="isRegisterMode = true" class="font-bold text-blue-500 hover:text-blue-800">
                        Register
                    </a>
                </template>
            </p>

        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

definePageMeta({ layout: false })
const { login, register } = useStrapiAuth()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isRegisterMode = ref(false)
const errorMessage = ref(null)
const isLoading = ref(false)

const passwordMismatch = computed(() => {
    return isRegisterMode.value && password.value !== confirmPassword.value && confirmPassword.value.length > 0;
})

// --- NEW: Helper function to translate Strapi errors ---
/**
 * Takes a Strapi error object and returns a user-friendly string.
 * @param {Error} error The error object caught from the API call.
 * @returns {string} A user-friendly error message.
 */
const mapStrapiError = (error) => {
    // First, handle network errors where there's no response object\
    console.log("Mapping Strapi Error:", error);
    // if (!error.error) {
    //     console.error("Network Error:", error.message);
    //     return 'Could not connect to the server. Please check your internet connection.';
    // }

    // Get the core error details from Strapi's response
    const errorDetails = error.error;
    if (!errorDetails) {
        return 'An unexpected server error occurred. Please try again.';
    }

    // Use the specific message from Strapi to determine the user-friendly text
    const message = (errorDetails.message || '').toLowerCase();

    switch (message) {
        case 'invalid identifier or password':
            return 'Incorrect email or password. Please try again.';

        // Registration-specific errors
        case 'email is already taken':
            return 'This email address is already registered. Please try logging in instead.';
        case 'username is already taken':
            return 'This username is not available. Please choose another one.';

        // Common validation errors (we use .includes() for flexibility)
        default:
            if (message.includes('password must be at least')) {
                return 'Password is too short. It must be at least 6 characters long.';
            }
            if (message.includes('must be a valid email')) {
                return 'Please enter a valid email address.';
            }
            // Fallback to the original Strapi message if it's something unexpected
            return errorDetails.message || 'An unknown error occurred.';
    }
}

const handleAuth = async () => {
    errorMessage.value = null
    isLoading.value = true;

    try {
        if (isRegisterMode.value) {
            if (passwordMismatch.value) {
                // This error is client-side, so we set it directly
                errorMessage.value = 'Passwords do not match.';
                // No need to throw, just return to stop execution
                return;
            }

            // Await the register function directly. If it fails, it will throw an error
            // which will be caught by the catch block.
            await register({
                username: username.value,
                email: email.value,
                password: password.value
            });
            router.push('/profile/edit')

        } else {
            // Await the login function. It will also throw an error on failure.
            await login({ identifier: email.value, password: password.value })
            router.push('/my-shelf');
        }
    } catch (e) {
        // --- UPDATED: Use the new helper function ---
        errorMessage.value = mapStrapiError(e);
        console.error("Auth Error:", e.response?.data || e.message);
    } finally {
        isLoading.value = false;
    }
}
</script>