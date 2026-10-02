<script setup lang="ts">
import { menuCategories, navItems, products, featuredProducts, socialLinks, textContent } from '~/data/menu'
import { useKompLocale } from '~/composables/useLocale'

const { locale, dir, switchLocale } = useKompLocale()
const activeCategory = ref('all')

const currentText = computed(() => textContent[locale.value])

const heroTopics = menuCategories.filter((category) => category.id !== 'all')

const heroSpotlight = products.find((product) => product.id === 'p05')!

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
            <div class="section-head">
              <small>{{ currentText.menu.eyebrow }}</small>
              <h2>{{ currentText.menu.title }}</h2>
            </div>

            <div class="menu-shell">
              <div class="category-row">
                <button
                  v-for="category in menuCategories"
                  :key="category.id"
                  class="category-button"
                  :class="{ active: activeCategory === category.id }"
                  @click="selectCategory(category.id)"
                >
                  <Icon :name="category.icon" class="category-icon" aria-hidden="true" />
                  {{ category.name[locale] }}
                </button>
              </div>

              <Transition name="product-swap" mode="out-in">
                <div :key="activeCategory" class="product-grid">
                  <article v-for="product in filteredProducts" :key="product.id" class="product-card">
                    <div class="card-media">
                      <img :src="product.image" :alt="product.name[locale]" loading="lazy" decoding="async" />
                    </div>
                    <div class="card-body">
                      <h3>{{ product.name[locale] }}</h3>
                      <p>{{ product.description[locale] }}</p>
                      <div class="card-meta">
                        <span class="price-tag">{{ currentText.menu.priceLabel }} {{ product.price }}</span>
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

      <AppFooter :text="currentText" />
    </div>
  </div>
</template>
