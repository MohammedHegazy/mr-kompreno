// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  icon: {
    provider: 'none',
    clientBundle: {
      scan: true,
      icons: [
        'simple-icons:instagram',
        'simple-icons:facebook',
        'simple-icons:whatsapp',
        'lucide:phone',
        'lucide:layout-grid',
        'lucide:flame',
        'lucide:pizza',
      ],
    },
  },
})
