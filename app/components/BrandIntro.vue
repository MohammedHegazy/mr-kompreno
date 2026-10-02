<script setup lang="ts">
const props = defineProps<{ text: Record<string, any> }>()
</script>

<template>
  <section id="about" class="section">
    <div class="container">
      <div class="about-panel" v-reveal="{ from: 'up', distance: 54, duration: 1200, ease: 'soft' }">
        <div class="content">
          <SectionHead :eyebrow="props.text.about.eyebrow" :title="props.text.about.title" index="02" />

          <p v-reveal="{ from: 'up', distance: 24, duration: 1000, delay: 240 }">
            {{ props.text.about.body }}
          </p>
        </div>

        <div
          class="highlight-box"
          v-reveal="{ from: 'scale', distance: 8, duration: 1100, delay: 340, ease: 'snap' }"
        >
          <span
            class="highlight-box__text"
            v-reveal="{ from: 'up', distance: 22, duration: 900, delay: 460 }"
          >{{ props.text.about.highlight }}</span>
        </div>
      </div>
    </div>
  </section>
</template>