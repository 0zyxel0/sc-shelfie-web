// ./nuxt.config.ts

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/strapi'
  ],
  strapi: {
    // This URL should point to your Strapi v5 backend
    url: process.env.STRAPI_URL || 'http://localhost:1337',
    user: {
      // Tell the module to populate the 'profilePicture' relation
      populate: ['profilePicture'],
      // This is a good default to ensure data is always fresh on login/refresh
      fetchOnLogin: true 
    }
  },
  app: {
    head: {
      title: 'Shelfie', // Default title
      titleTemplate: '%s | Shelfie', // Template for page-specific titles
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Your Digital Collector Shelf for figures, models, and memorabilia.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' } // Example for a favicon
      ]
    }
  },
  runtimeConfig: {
    paymongoSecretKey: process.env.PAYMONGO_SECRET_KEY,
    public: {
      paymongoPublicKey: process.env.PAYMONGO_PUBLIC_KEY,
      strapi: {
        url: process.env.STRAPI_URL || "http://localhost:1337",
      },
      // Add this block for Meilisearch
      meilisearch: {
        hostURL: process.env.MEILISEARCH_HOST_URL,
        searchApiKey: process.env.MEILISEARCH_SEARCH_API_KEY,
      },
    },
  },
})