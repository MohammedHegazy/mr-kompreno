<script setup lang="ts">
const props = defineProps<{ text: Record<string, any> }>()
</script>

<template>
  <footer class="footer">
    <div
      class="container footer-inner"
      v-reveal="{ from: 'up', distance: 20, duration: 900, ease: 'soft' }"
    >
      <div class="footer-brand">
        <SkeletonImage src="/images/logo/logo-without-background.png" alt="MR.KOMPRENO footer logo" :width="280" :height="270" />
        <small>{{ props.text.footer.designed }} {{ props.text.footer.provider }}</small>
      </div>

      <div class="footer-right">
        © {{ new Date().getFullYear() }} MR.KOMPRENO · {{ props.text.footer.rights }}
      </div>
    </div>
  </footer>
</template>