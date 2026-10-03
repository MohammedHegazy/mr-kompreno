<script setup lang="ts">
import { observeLiveness, releaseLiveness } from '~/utils/liveness.client'

withDefaults(defineProps<{ variant?: 'hero' | 'ember' }>(), {
  variant: 'hero',
})

const root = ref<HTMLElement | null>(null)

/**
 * The layer registers itself on mount rather than waiting for a single
 * document-wide scan. Instances that appear later — a category swap, a locale
 * change, the header reopening — were previously never observed at all, which
 * left their loops running at full rate with nothing to stop them.
 */
onMounted(() => {
  if (root.value) observeLiveness(root.value)
})

onBeforeUnmount(() => {
  if (root.value) releaseLiveness(root.value)
})
</script>

<template>
  <div ref="root" class="brand-motion" :class="`brand-motion--${variant}`" aria-hidden="true">
    <div class="brand-motion__pattern" />
    <div class="brand-motion__etching" />
    <span class="brand-motion__sweep brand-motion__sweep--one" />
  </div>
</template>
