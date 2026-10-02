<script setup lang="ts">
const { dir } = useKompLocale()
</script>

<template>
  <div class="system-backdrop" :dir="dir" aria-hidden="true" role="presentation">
    <span class="system-backdrop__base" />
    <span class="system-backdrop__light system-backdrop__light--amber" />
    <span class="system-backdrop__light system-backdrop__light--ember" />
    <span class="system-backdrop__light system-backdrop__light--cool" />
    <span class="system-backdrop__rules">
      <span class="system-backdrop__rules-grid" />
    </span>
    <span class="system-backdrop__baseline" />
    <span class="system-backdrop__dither" />
    <span class="system-backdrop__sweep" />
    <span class="system-backdrop__vignette" />
    <span class="system-backdrop__grain" />
  </div>
</template>