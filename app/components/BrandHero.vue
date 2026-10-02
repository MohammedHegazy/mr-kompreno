<script setup lang="ts">
import type { Locale, MenuCategory, MenuProduct } from '~/data/menu'
import BrandMotionBackground from './BrandMotionBackground.vue'

const emit = defineEmits<{ select: [categoryId: string] }>()

const props = defineProps<{
  text: Record<string, any>
  locale: Locale
  topics: MenuCategory[]
  spotlight: MenuProduct
}>()
</script>

<template>
  <section id="home" class="hero">
    <div class="container hero-grid">
      <BrandMotionBackground variant="hero" />

      <div class="hero-copy">
        <div class="hero-brand" v-reveal="{ from: 'up', distance: 22, duration: 900 }">
          <span class="hero-logo">
            <img src="/images/logo/logo-without-background.png" alt="MR.KOMPRENO" width="280" height="270" />
          </span>
          <span class="hero-kicker">
            <span class="hero-kicker-dot" aria-hidden="true" />
            {{ props.text.hero.eyebrow }}
          </span>
        </div>

        <div class="hero-title-mask">
          <h1 v-reveal="{ from: 'up', distance: 38, duration: 1100, delay: 90, ease: 'expo' }">
            {{ props.text.hero.title }}
          </h1>
        </div>

        <p v-reveal="{ from: 'up', distance: 26, duration: 950, delay: 190 }">{{ props.text.hero.subtitle }}</p>

        <div class="hero-actions" v-reveal="{ from: 'up', distance: 22, duration: 900, delay: 270 }">
          <a href="#menu" class="primary-button">
            <Icon name="lucide:utensils" class="action-icon" aria-hidden="true" />
            {{ props.text.hero.primary }}
          </a>
          <a href="#contact" class="secondary-button">
            <Icon name="lucide:message-circle" class="action-icon" aria-hidden="true" />
            {{ props.text.hero.secondary }}
          </a>
        </div>

        <ul class="hero-topics">
          <li
            v-for="topic in props.topics"
            :key="topic.id"
            v-reveal="{ from: 'up', distance: 18, duration: 800, delay: 340, stagger: 70 }"
          >
            <button type="button" class="hero-topic" @click="emit('select', topic.id)">
              <Icon :name="topic.icon" class="hero-topic-icon" aria-hidden="true" />
              {{ topic.name[props.locale] }}
            </button>
          </li>
        </ul>
      </div>

      <div class="hero-visual">
        <figure
          class="hero-frame"
          v-reveal="{ from: 'curtain', duration: 1400, delay: 240, ease: 'mask' }"
        >
          <img
            :src="props.spotlight.image"
            :alt="props.spotlight.name[props.locale]"
            width="1200"
            height="800"
            fetchpriority="high"
            decoding="async"
          />
        </figure>

        <div
          class="hero-tag"
          v-reveal="{ from: 'scale', distance: 9, duration: 1000, delay: 820, ease: 'snap' }"
        >
          <span class="hero-tag-name">{{ props.spotlight.name[props.locale] }}</span>
          <span class="hero-tag-price">
            <bdi>{{ props.text.menu.priceLabel }} {{ props.spotlight.price }}</bdi>
          </span>
        </div>

        <span
          class="hero-glass"
          v-reveal="{ from: 'scale', distance: 12, duration: 1000, delay: 940, ease: 'snap' }"
        >
          <Icon name="lucide:flame" class="hero-glass-icon" aria-hidden="true" />
          {{ props.text.about.highlight }}
        </span>
      </div>
    </div>
  </section>
</template>