// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  app: {
    head: {
      script: [
        {
          // Marks JS as available so the brand loader can render, and hides it for
          // returning visitors in the same session so repeat views stay instant.
          innerHTML:
            "(function(){var d=document.documentElement;d.setAttribute('data-loader','js');try{if(sessionStorage.getItem('kompreno.loader.seen')){d.setAttribute('data-loader','off')}}catch(e){}})()",
        },
      ],
    },
  },
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
