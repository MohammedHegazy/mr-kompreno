<script setup lang="ts">
const props = defineProps<{ text: Record<string, any> }>()
</script>

<template>
  <section id="about" class="section">
    <div class="container">
      <div class="about-panel">
        <div class="content">
          <div class="section-head">
            <small>{{ props.text.about.eyebrow }}</small>
            <h2>{{ props.text.about.title }}</h2>
          </div>
          <p>{{ props.text.about.body }}</p>
        </div>

        <div class="highlight-box">
          {{ props.text.about.highlight }}
        </div>
      </div>
    </div>
  </section>
</template>
