<script setup lang="ts">
const props = withDefaults(defineProps<{
  eyebrow: string
  title: string
  index?: string
  tone?: 'light' | 'dark'
}>(), {
  index: '',
  tone: 'light',
})
</script>

<template>
  <header
    class="section-head"
    :class="`section-head--${props.tone}`"
    v-reveal="{ from: 'up', distance: 24, duration: 800, ease: 'soft' }"
  >
    <div class="section-head__meta">
      <span v-if="props.index" class="section-head__index">{{ props.index }}</span>
      <span class="section-head__rule" aria-hidden="true" />
      <small class="section-head__eyebrow">{{ props.eyebrow }}</small>
    </div>

    <div class="section-head__title-mask">
      <h2
        v-reveal="{ from: 'up', distance: 34, duration: 1100, delay: 90, ease: 'expo' }"
      >{{ props.title }}</h2>
    </div>
  </header>
</template>