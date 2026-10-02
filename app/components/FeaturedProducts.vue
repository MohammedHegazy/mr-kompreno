<script setup lang="ts">
import type { Locale, MenuProduct } from '~/data/menu'

const props = defineProps<{ items: MenuProduct[]; text: Record<string, any>; locale: Locale }>()
</script>

<template>
  <section class="section featured-products">
    <div class="container">
      <div class="section-head">
        <small>{{ props.text.menu.eyebrow }}</small>
        <h2>{{ props.text.menu.title }}</h2>
      </div>

      <div class="featured-grid">
        <article v-for="item in props.items" :key="item.id" class="card">
          <div class="card-media">
            <img :src="item.image" :alt="item.name[props.locale]" />
          </div>
          <div class="card-body">
            <h3>{{ item.name[props.locale] }}</h3>
            <p>{{ item.description[props.locale] }}</p>
            <div class="card-meta">
              <span class="price-tag">{{ props.text.menu.priceLabel }} {{ item.price }}</span>
              <span class="badge">{{ props.text.menu.cta }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
