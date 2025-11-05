<template>
    <div class="bg-white font-sans text-gray-800">
        <!-- Hero Section -->
        <main class="container mx-auto px-6 pt-16 pb-24">
            <div class="grid lg:grid-cols-2 gap-12 items-center relative">
                <div class="z-10">
                    <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                        Show it. Organize it. Love it.
                    </h1>
                    <h2 class="text-5xl md:text-6xl font-extrabold text-blue-600 leading-tight mt-2">
                        Your Collection, Your Shelfie.
                    </h2>
                    <p class="mt-6 text-lg text-gray-600 max-w-lg">
                        A smart way to catalog and share your collectibles — from toys to art, and everything in between.
                    </p>
                    <div class="mt-8 flex items-center space-x-4">
                        <button class="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition">
                            <span>Start Collecting</span>
                            <ArrowRight class="w-5 h-5" />
                        </button>
                        <button class="bg-white text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 flex items-center space-x-2 hover:bg-gray-50 transition">
                            <PlayCircle class="w-5 h-5 text-gray-500" />
                            <span>View Demo</span>
                        </button>
                    </div>
                </div>
                <div class="relative">
                    <div class="absolute -top-10 -right-10 w-32 h-32 bg-teal-200/50 rounded-full z-0"></div>
                    <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-200/50 rounded-full z-0"></div>
                    <img src="https://images.pexels.com/photos/8995454/pexels-photo-8995454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Stormtrooper collectible toy" class="rounded-2xl shadow-xl w-full h-full object-cover z-10 relative">
                </div>
            </div>
        </main>

        <!-- Showcased Collections -->
        <section class="bg-gray-50 py-24">
            <div class="container mx-auto px-6 text-center">
                <h2 class="text-4xl font-bold text-gray-900">Recently Added Items</h2>
                <p class="mt-4 text-lg text-gray-600">See the latest treasures added by our passionate collectors.</p>

                <!-- Loading State -->
                <div v-if="pending" class="mt-12 text-gray-500">
                    Loading featured items...
                </div>

                <!-- No Items State -->
                <div v-else-if="!featuredItems || featuredItems.length === 0" class="mt-12 text-center py-16 bg-white rounded-lg border">
                    <h3 class="text-xl font-semibold text-gray-800">No Items to Showcase</h3>
                    <p class="text-gray-500 mt-2">Check back later to see what's new!</p>
                </div>

                <!-- Dynamic Grid -->
                <div v-else class="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    <NuxtLink v-for="item in featuredItems" :key="item.id" :to="`/items/${item.documentId}`" class="block bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-2 transition duration-300 group">
                        <div class="relative">
                            <img :src="item.userImages[0]?.url || '/image-placeholder.png'" :alt="item.name" class="w-full h-56 object-cover group-hover:opacity-90 transition-opacity">
                            <span v-if="item.categories && item.categories.length > 0" class="absolute top-4 right-4 text-xs font-semibold py-1 px-3 rounded-full bg-blue-100 text-blue-800">
                                {{ item.categories[0].name }}
                            </span>
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold text-gray-900 truncate">{{ item.name }}</h3>
                            <p class="mt-1 text-gray-500 text-sm">by @{{ item.user?.username || 'unknown' }}</p>
                            <div class="mt-4 flex items-center text-sm font-semibold text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                                </svg>
                                {{ item.likedBy?.length || 0 }} Favorites
                            </div>
                        </div>
                    </NuxtLink>
                </div>

                <NuxtLink to="/explore" class="mt-12 inline-flex items-center text-blue-600 font-semibold hover:text-blue-800 transition">
                    Explore all items
                    <ArrowRight class="w-5 h-5 ml-1" />
                </NuxtLink>
            </div>
        </section>

        <!-- Features Toolkit -->
        <section class="py-24">
            <div class="container mx-auto px-6 text-center">
                <h2 class="text-4xl font-bold text-gray-900">Every collector's dream toolkit</h2>
                <p class="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">Shelfie comes packed with all the features you need to manage your growing collection.</p>
                <div class="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    <div v-for="feature in toolkitFeatures" :key="feature.title" class="bg-gray-50/70 p-8 rounded-2xl">
                        <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="feature.iconBg">
                            <component :is="feature.icon" class="w-6 h-6" :class="feature.iconColor" />
                        </div>
                        <h3 class="mt-6 text-xl font-bold text-gray-900">{{ feature.title }}</h3>
                        <p class="mt-2 text-gray-600">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section class="bg-gray-50 py-24">
            <div class="container mx-auto px-6 text-center">
                <h2 class="text-4xl font-bold text-gray-900">Collect more with Premium</h2>
                <p class="mt-4 text-lg text-gray-600">Unlock the full potential of your digital shelf with our premium features.</p>
                <div class="mt-12 max-w-4xl mx-auto grid lg:grid-cols-3 gap-px bg-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    <div class="bg-white p-6 lg:p-8 flex flex-col justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 text-left">Feature</h3>
                            <ul class="mt-8 space-y-5 text-left text-gray-600">
                                <li v-for="feature in pricingFeatures" :key="feature">{{ feature }}</li>
                            </ul>
                        </div>
                    </div>
                    <div class="bg-white p-6 lg:p-8 flex flex-col">
                        <h3 class="text-2xl font-bold text-gray-900">Free</h3>
                        <p class="text-gray-500 mt-2">Perfect for casual collectors</p>
                        <ul class="mt-8 space-y-5 text-gray-800 font-medium flex-grow">
                            <li>Up to 50 items</li>
                            <li>3 categories</li>
                            <li>100MB</li>
                            <li>
                                <Check class="w-6 h-6 text-green-500" />
                            </li>
                            <li>Basic</li>
                            <li>
                                <X class="w-6 h-6 text-red-500" />
                            </li>
                            <li>
                                <X class="w-6 h-6 text-red-500" />
                            </li>
                        </ul>
                        <button class="mt-8 w-full bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-200 transition">Start Free</button>
                    </div>
                    <div class="bg-blue-50 p-6 lg:p-8 flex flex-col border-2 border-blue-600 rounded-2xl -m-px">
                        <div class="flex justify-between items-center">
                            <h3 class="text-2xl font-bold text-gray-900">Premium</h3>
                            <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
                        </div>
                        <p class="text-gray-500 mt-2">For serious collectors</p>
                        <ul class="mt-8 space-y-5 text-gray-800 font-medium flex-grow">
                            <li>Unlimited items</li>
                            <li>Unlimited categories</li>
                            <li>10GB</li>
                            <li>
                                <Check class="w-6 h-6 text-green-500" />
                            </li>
                            <li>Advanced with graphs</li>
                            <li>
                                <Check class="w-6 h-6 text-green-500" />
                            </li>
                            <li>
                                <Check class="w-6 h-6 text-green-500" />
                            </li>
                        </ul>
                        <button class="mt-8 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition">Go Premium</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="bg-blue-600">
            <div class="container mx-auto px-6 py-20 text-center">
                <h2 class="text-4xl font-bold text-white">Start building your digital shelf today</h2>
                <p class="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">Join thousands of collectors who've found a home for their treasures on Shelfie.</p>
                <div class="mt-8 flex justify-center space-x-4">
                    <button class="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition">Join Free</button>
                    <button class="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg border-2 border-blue-400 hover:bg-blue-700 transition flex items-center space-x-2">
                        <span>Upgrade to Premium</span>
                        <ArrowRight class="w-5 h-5" />
                    </button>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-slate-900 text-slate-400">
            <div class="container mx-auto px-6 py-16">
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div>
                        <h3 class="text-2xl font-bold text-white">Shelfie</h3>
                        <p class="mt-4">The ultimate digital shelf for collectors.</p>
                        <div class="mt-6 flex space-x-4">
                            <a href="#" class="hover:text-white">
                                <Twitter class="w-6 h-6" />
                            </a>
                            <a href="#" class="hover:text-white">
                                <Instagram class="w-6 h-6" />
                            </a>
                            <a href="#" class="hover:text-white">
                                <Facebook class="w-6 h-6" />
                            </a>
                            <a href="#" class="hover:text-white">
                                <Youtube class="w-6 h-6" />
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-white font-semibold tracking-wider">Company</h4>
                        <ul class="mt-4 space-y-2">
                            <li><a href="#" class="hover:text-white">About</a></li>
                            <li><a href="#" class="hover:text-white">Careers</a></li>
                            <li><a href="#" class="hover:text-white">Blog</a></li>
                            <li><a href="#" class="hover:text-white">Press</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-white font-semibold tracking-wider">Resources</h4>
                        <ul class="mt-4 space-y-2">
                            <li><a href="#" class="hover:text-white">Features</a></li>
                            <li><a href="#" class="hover:text-white">Pricing</a></li>
                            <li><a href="#" class="hover:text-white">FAQ</a></li>
                            <li><a href="#" class="hover:text-white">Support</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-white font-semibold tracking-wider">Legal</h4>
                        <ul class="mt-4 space-y-2">
                            <li><a href="#" class="hover:text-white">Privacy</a></li>
                            <li><a href="#" class="hover:text-white">Terms</a></li>
                            <li><a href="#" class="hover:text-white">Cookies</a></li>
                            <li><a href="#" class="hover:text-white">Licenses</a></li>
                        </ul>
                    </div>
                </div>
                <div class="mt-16 pt-8 border-t border-slate-800 text-center text-sm">
                    <p>&copy; 2025 Shelfie. All rights reserved.</p>
                </div>
            </div>
        </footer>

    </div>
</template>
<script setup>
import {
    ArrowRight, PlayCircle, ToyBrick, Clapperboard, Gamepad2, Mic2, BookOpen, Camera,
    UploadCloud, PlusSquare, BarChart2, Palette, Share2, Tag, Check, X, // Changed 'Customize' to 'Palette'
    Twitter, Instagram, Facebook, Youtube
} from 'lucide-vue-next';

// --- NEW: Data Fetching for Featured Items ---
const { find } = useStrapi();

const { data: featuredItems, pending } = await useAsyncData(
    'homepage-featured-items',
    () => find('items', {
        sort: 'createdAt:desc',
        pagination: {
            limit: 6,
        },
        populate: ['userImages', 'user', 'categories', 'likedBy'],
    }),
    {
        transform: (response) => response.data
    }
);
// --- End of New Data Fetching ---


const collections = [
    {
        title: 'Vintage Action Figures',
        owner: "Michael's Collection",
        items: 143,
        image: 'https://images.pexels.com/photos/1059946/pexels-photo-1059946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        tag: { name: 'Toys', icon: ToyBrick, color: 'bg-blue-100 text-blue-800' }
    },
    {
        title: 'Anime Figurines',
        owner: "Sarah's Showcase",
        items: 87,
        image: 'https://images.pexels.com/photos/775417/pexels-photo-775417.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        tag: { name: 'Anime', icon: Clapperboard, color: 'bg-red-100 text-red-800' }
    },
    {
        title: 'Retro Gaming',
        owner: 'Retro Haven',
        items: 214,
        image: 'https://images.pexels.com/photos/1390361/pexels-photo-1390361.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        tag: { name: 'Gaming', icon: Gamepad2, color: 'bg-indigo-100 text-indigo-800' }
    },
    {
        title: 'Vinyl Records',
        owner: 'Classic Sounds',
        items: 328,
        image: 'https://images.pexels.com/photos/158742/g-clef-song-music-classic-158742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        tag: { name: 'Music', icon: Mic2, color: 'bg-purple-100 text-purple-800' }
    },
    {
        title: 'Comic Book Collection',
        owner: 'Superhero Vault',
        items: 456,
        image: 'https://images.pexels.com/photos/2763240/pexels-photo-2763240.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        tag: { name: 'Comics', icon: BookOpen, color: 'bg-yellow-100 text-yellow-800' }
    },
    {
        title: 'Vintage Cameras',
        owner: 'Photography Archive',
        items: 76,
        image: 'https://images.pexels.com/photos/244883/pexels-photo-244883.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        tag: { name: 'Photography', icon: Camera, color: 'bg-green-100 text-green-800' }
    }
];

const toolkitFeatures = [
    {
        icon: UploadCloud,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Upload and organize your items',
        description: 'Easily add new items to your collection with our intuitive interface.'
    },
    {
        icon: PlusSquare,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        title: 'Add photos, prices, and reviews',
        description: 'Document every detail about your collectibles in one place.'
    },
    {
        icon: BarChart2,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: 'Track your collection\'s value',
        description: 'Keep tabs on your investment with automatic value tracking.'
    },
    {
        icon: Palette, // Changed from 'Customize'
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        title: 'Customize categories and themes',
        description: 'Make your digital shelf as unique as your collection.'
    },
    {
        icon: Share2,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        title: 'Share your digital shelf',
        description: 'Let friends and fellow collectors admire your treasures.'
    },
    {
        icon: Tag,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        title: 'Smart tagging system',
        description: 'Find any item in your collection instantly with powerful search.'
    }
];

const pricingFeatures = [
    'Collection Items',
    'Custom Categories',
    'Photo Storage',
    'Collection Sharing',
    'Value Tracking',
    'Custom Themes',
    'API Access'
];

</script>