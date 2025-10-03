<template>
    <!-- Your template remains unchanged -->
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
import { ref, computed } from 'vue'; // Ensure computed is imported

definePageMeta({ layout: false })
const { login, register } = useStrapiAuth()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('') // New state for confirmation
const isRegisterMode = ref(false)
const errorMessage = ref(null)

// Computed property to check if passwords match
const passwordMismatch = computed(() => {
    return isRegisterMode.value && password.value !== confirmPassword.value && confirmPassword.value.length > 0;
})

const handleAuth = async () => {
    errorMessage.value = null

    // Pre-check for registration mode
    if (isRegisterMode.value) {
        if (password.value !== confirmPassword.value) {
            errorMessage.value = 'Password and confirmation password do not match.';
            return;
        }
    }

    try {
        if (isRegisterMode.value) {
            // Strapi registration call
            const data = await register({
                username: username.value,
                email: email.value,
                password: password.value
            });
            // Note: useStrapiAuth's register usually throws if there's an error status code
            if (data.error) {
                // If it successfully returns an error payload (e.g., validation failed)
                throw new Error(data.error.message);
            }
            router.push('/profile/edit')

        } else {
            // Strapi login call
            const result = await login({ identifier: email.value, password: password.value })
            if (result) {
                router.push('/my-shelf');
            }
        }
    } catch (e) {
        // Handle Strapi errors which are often nested in e.response.data.error
        errorMessage.value = e.response?.data?.error?.message || e.message || 'An unexpected error occurred during authentication.'
        console.error("Auth Error:", e);
    }
}
</script>