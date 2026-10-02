<script setup lang="ts">
import type { Locale, MenuProduct } from '~/data/menu'

const props = defineProps<{ items: MenuProduct[]; text: Record<string, any>; locale: Locale }>()
</script>

<template>
  <section class="section featured-products">
    <div class="container">
      <SectionHead :eyebrow="props.text.menu.eyebrow" :title="props.text.menu.title" index="01" />

      <div class="featured-grid">
        <article
          v-for="(item, position) in props.items"
          :key="item.id"
          class="card"
          v-reveal="{
            from: position % 2 === 0 ? 'start' : 'end',
            distance: 76,
            duration: 1150,
            stagger: 130,
          }"
        >
          <div
            class="card-media"
            v-reveal="{ from: 'curtain', duration: 1100, delay: 180, ease: 'mask' }"
          >
            <img :src="item.image" :alt="item.name[props.locale]" decoding="async" />
          </div>

          <div class="card-body">
            <h3 v-reveal="{ from: 'up', distance: 16, duration: 800, delay: 160 }">
              {{ item.name[props.locale] }}
            </h3>

            <p v-reveal="{ from: 'up', distance: 16, duration: 800, delay: 230 }">
              {{ item.description[props.locale] }}
            </p>

            <div class="card-meta">
              <span
                class="price-tag"
                v-reveal="{ from: 'scale', distance: 14, duration: 900, delay: 320, ease: 'snap' }"
              >{{ props.text.menu.priceLabel }} {{ item.price }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>