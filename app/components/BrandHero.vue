<script setup lang="ts">
import BrandMotionBackground from './BrandMotionBackground.vue'

const props = defineProps<{ text: Record<string, any> }>()
</script>

<template>
  <section id="home" class="hero">
    <div class="container hero-grid">
      <BrandMotionBackground variant="hero" />

      <div class="hero-copy">
        <span class="hero-kicker">{{ props.text.hero.eyebrow }}</span>
        <h1>{{ props.text.hero.title }}</h1>
        <p>{{ props.text.hero.subtitle }}</p>

        <div class="hero-actions">
          <a href="#menu" class="primary-button">
            <Icon name="lucide:utensils" class="action-icon" aria-hidden="true" />
            {{ props.text.hero.primary }}
          </a>
          <a href="#contact" class="secondary-button">
            <Icon name="lucide:message-circle" class="action-icon" aria-hidden="true" />
            {{ props.text.hero.secondary }}
          </a>
        </div>
      </div>

      <div class="hero-visual">
        <div class="hero-card">
          <img src="/items/1611741895534.jpg" alt="Featured KOMPRENO product" />
          <div class="hero-badge">KOMPRENO</div>
        </div>
      </div>
    </div>
  </section>
</template>
