<script setup lang="ts">
import { menuCategories, navItems, products, featuredProducts, socialLinks, textContent } from '~/data/menu'
import { useKompLocale } from '~/composables/useLocale'
import { CHAPTER_ORDER, useActiveSection } from '~/composables/useActiveSection'

const { locale, dir, switchLocale } = useKompLocale()
const activeCategory = ref('all')

const currentText = computed(() => textContent[locale.value])

const heroTopics = menuCategories.filter((category) => category.id !== 'all')

const heroSpotlight = products.find((product) => product.id === 'p05')!

// Rail ticks follow the visual page order so their numbers match the section heads.
const railOrder = CHAPTER_ORDER

// One observer feeds both the side rail and the header highlight, so the two
// can never disagree about which chapter the visitor is reading.
const { activeId, activeIndex, travel, visible } = useActiveSection(railOrder)

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
    <SectionProgressRail
      :items="railItems"
      :active-index="activeIndex"
      :travel="travel"
      :visible="visible"
    />

    <div class="page-content">
      <AppHeader
        :text="currentText"
        :items="railItems"
        :social-links="socialLinks"
        :active-id="activeId"
        :locale="locale"
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
                  <ProductCard
                    v-for="(product, position) in filteredProducts"
                    :key="product.id"
                    v-reveal="{ from: 'up', distance: 40, duration: 1000, delay: 220, stagger: 80 }"
                    :item="product"
                    :text="currentText"
                    :locale="locale"
                    :index="position + 1"
                  />
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