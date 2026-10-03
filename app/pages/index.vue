<script setup lang="ts">
import { menuCategories, navItems, products, featuredProducts, socialLinks, textContent } from '~/data/menu'
import { useKompLocale } from '~/composables/useLocale'

const { locale, dir, switchLocale } = useKompLocale()
const activeCategory = ref('all')

const currentText = computed(() => textContent[locale.value])

const heroTopics = menuCategories.filter((category) => category.id !== 'all')

const heroSpotlight = products.find((product) => product.id === 'p05')!

// Rail ticks follow the visual page order so their numbers match the section heads.
const railOrder = ['home', 'about', 'menu', 'contact'] as const

const railItems = computed(() => railOrder
  .map((id) => navItems.find((item) => item.id === id))
  .filter((item) => Boolean(item))
  .map((item) => ({
    id: item!.id,
    label: locale.value === 'ar' ? item!.ar : item!.en,
  })))

const filteredProducts = computed(() => {
  if (activeCategory.value === 'all') return products
  return products.filter((product) => product.categoryId === activeCategory.value)
})

function selectCategory(categoryId: string) {
  activeCategory.value = categoryId

  nextTick(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('menu')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  })
}

useSeoMeta({
  title: computed(() => (locale.value === 'ar' ? 'MR.KOMPRENO | القائمة الرقمية' : 'MR.KOMPRENO | Digital Menu')),
  description: computed(() => (locale.value === 'ar' ? 'قائمة رقمية احترافية لعلامة MR.KOMPRENO الغذائية.' : 'Professional digital menu and brand experience for MR.KOMPRENO.')),
  ogTitle: 'MR.KOMPRENO',
  ogDescription: 'A premium bilingual digital menu and brand showcase.',
})
</script>

<template>
  <div class="page-shell" :dir="dir">
    <SectionProgressRail :items="railItems" />

    <div class="page-content">
      <AppHeader
        :locale="locale"
        :nav-items="navItems"
        :text="currentText"
        @switch-locale="switchLocale"
      />

      <main>
        <BrandHero :text="currentText" :locale="locale" :topics="heroTopics" :spotlight="heroSpotlight" @select="selectCategory" />
        <FeaturedProducts :items="featuredProducts" :text="currentText" :locale="locale" />
        <BrandIntro :text="currentText" />

        <section id="menu" class="section">
          <div class="container">
            <SectionHead :eyebrow="currentText.menu.eyebrow" :title="currentText.menu.title" index="03" />

            <div class="menu-shell" v-reveal="{ from: 'up', distance: 50, duration: 1200, ease: 'soft' }">
              <div class="category-row">
                <button
                  v-for="category in menuCategories"
                  :key="category.id"
                  class="category-button"
                  :class="{ active: activeCategory === category.id }"
                  @click="selectCategory(category.id)"
                  v-reveal="{ from: 'up', distance: 18, duration: 750, delay: 160, stagger: 60 }"
                >
                  <Icon :name="category.icon" class="category-icon" aria-hidden="true" />
                  {{ category.name[locale] }}
                </button>
              </div>

              <Transition name="product-swap" mode="out-in">
                <div :key="activeCategory" class="product-grid">
                  <article
                    v-for="product in filteredProducts"
                    :key="product.id"
                    class="product-card"
                    v-reveal="{ from: 'up', distance: 40, duration: 1000, delay: 220, stagger: 80 }"
                  >
                    <div
                      class="card-media"
                      v-reveal="{ from: 'curtain', duration: 1000, delay: 200, ease: 'mask' }"
                    >
                      <SkeletonImage :src="product.image" :alt="product.name[locale]" />
                    </div>
                    <div class="card-body">
                      <h3 v-reveal="{ from: 'up', distance: 16, duration: 800, delay: 180 }">
                        {{ product.name[locale] }}
                      </h3>
                      <p v-reveal="{ from: 'up', distance: 16, duration: 800, delay: 240 }">
                        {{ product.description[locale] }}
                      </p>
                      <div class="card-meta">
                        <span
                          class="price-tag"
                          v-reveal="{ from: 'scale', distance: 14, duration: 900, delay: 320, ease: 'snap' }"
                        >{{ currentText.menu.priceLabel }} {{ product.price }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </Transition>
            </div>
          </div>
        </section>

        <ContactSection :text="currentText" :social-links="socialLinks" />
      </main>

      <AppFooter
        :text="currentText"
        :social-links="socialLinks"
        :locale="locale"
        @switch-locale="switchLocale"
      />
    </div>
  </div>
</template>