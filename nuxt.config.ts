// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/images/logo/icon-32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href: '/images/logo/icon-192.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/images/logo/apple-touch-icon.png',
        },
      ],
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
    // 'none' rendered every icon as an empty placeholder. 'server' is unusable
    // here because Nitro strips the server bundle's JSON collection imports, so
    // no collection resolves and no _nuxt_icon route is emitted. 'iconify'
    // resolves from the client bundle, which carries all icons above.
    provider: 'iconify',
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
        'lucide:utensils',
        'lucide:menu',
        'lucide:languages',
        'lucide:message-circle',
        'lucide:arrow-up',
        'lucide:arrow-up-right',
        'lucide:chevron-down',
        'lucide:shopping-bag',
        'lucide:check',
        'lucide:plus',
        'lucide:minus',
        'lucide:x',
      ],
    },
  },
})
