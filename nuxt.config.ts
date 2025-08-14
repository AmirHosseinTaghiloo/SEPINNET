// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

    plugins: [
      // '~/plugins/v-tooltip.js',
      
    ],
      vite: {
    server: {
      timeout: 30000 // به عنوان مثال 30 ثانیه
    }
  },



  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui'
  ],
  css: ['~/assets/css/main.css',
    '@/assets/css/global.css',
]
})