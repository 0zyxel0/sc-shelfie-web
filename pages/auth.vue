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
                <div class="mb-6">
                    <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input v-model="password" type="password" id="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" required />
                </div>

                <!-- Submit Button -->
                <div class="flex items-center justify-between">
                    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
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
definePageMeta({ layout: false })
const { login, register } = useStrapiAuth()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const isRegisterMode = ref(false)
const errorMessage = ref(null)

const handleAuth = async () => {
    errorMessage.value = null
    try {
        if (isRegisterMode.value) {
            const data = await register({
                username: username.value,
                email: email.value,
                password: password.value
            });
            if (data.error) {
                throw new Error(data.error.message);
            }
            router.push('/profile/edit')

        } else {
            const result = await login({ identifier: email.value, password: password.value })
            if (result) {
                router.push('/my-shelf');
            }
        }
    } catch (e) {
        errorMessage.value = e.data?.statusMessage || 'An unexpected error occurred.'
    }
}
</script>