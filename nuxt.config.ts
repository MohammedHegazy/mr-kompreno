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
        'lucide:globe',
      ],
    },
  },
})
