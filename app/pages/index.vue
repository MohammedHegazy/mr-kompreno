<script setup lang="ts">
import { menuCategories, navItems, products, featuredProducts, socialLinks, textContent } from '~/data/menu'
import { useKompLocale } from '~/composables/useLocale'

const { locale, dir, switchLocale } = useKompLocale()
const activeCategory = ref('all')

const currentText = computed(() => textContent[locale.value])

const filteredProducts = computed(() => {
  if (activeCategory.value === 'all') return products
  return products.filter((product) => product.categoryId === activeCategory.value)
})

useSeoMeta({
  title: computed(() => (locale.value === 'ar' ? 'KOMPRENO | القائمة الرقمية' : 'KOMPRENO | Digital Menu')),
  description: computed(() => (locale.value === 'ar' ? 'قائمة رقمية احترافية لعلامة كومبرينو الغذائية.' : 'Professional digital menu and brand experience for KOMPRENO.')),
  ogTitle: 'KOMPRENO',
  ogDescription: 'A premium bilingual digital menu and brand showcase.',
})
</script>

<template>
  <div class="page-shell" :dir="dir">
    <AppHeader
      :locale="locale"
      :nav-items="navItems"
      :text="currentText"
      @switch-locale="switchLocale"
    />

    <main>
      <BrandHero :text="currentText" />
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
                @click="activeCategory = category.id"
              >
                {{ category.name[locale] }}
              </button>
            </div>

            <div class="product-grid">
              <article v-for="product in filteredProducts" :key="product.id" class="product-card">
                <div class="card-media">
                  <img :src="product.image" :alt="product.name[locale]" />
                </div>
                <div class="card-body">
                  <h3>{{ product.name[locale] }}</h3>
                  <p>{{ product.description[locale] }}</p>
                  <div class="card-meta">
                    <span class="price-tag">{{ currentText.menu.priceLabel }} {{ product.price }}</span>
                    <span class="badge">{{ currentText.menu.cta }}</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <ContactSection :text="currentText" :social-links="socialLinks" />
    </main>

    <AppFooter :text="currentText" />
  </div>
</template>
