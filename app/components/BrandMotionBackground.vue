<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'hero' | 'ember' }>(), {
  variant: 'hero',
})
</script>

<template>
  <div class="brand-motion" :class="`brand-motion--${variant}`" aria-hidden="true">
    <div class="brand-motion__pattern" />
    <div class="brand-motion__etching" />
    <span class="brand-motion__sweep brand-motion__sweep--one" />
    <span class="brand-motion__sweep brand-motion__sweep--two" />
  </div>
</template>