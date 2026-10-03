<script setup lang="ts">
import type { Locale, MenuProduct } from '~/data/menu'

const props = defineProps<{ items: MenuProduct[]; text: Record<string, any>; locale: Locale }>()
</script>

<template>
  <section class="section featured-products">
    <div class="container">
      <SectionHead :eyebrow="props.text.menu.eyebrow" :title="props.text.menu.title" index="01" />

      <div class="featured-grid">
        <ProductCard
          v-for="(item, position) in props.items"
          :key="item.id"
          v-reveal="{ from: 'up', distance: 64, duration: 1050, stagger: 150 }"
          :item="item"
          :text="props.text"
          :locale="props.locale"
          :index="position + 1"
        />
      </div>
    </div>
  </section>
</template>
