<script setup lang="ts">
const props = defineProps<{ text: Record<string, any> }>()
</script>

<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="/images/logo/logo-without-background.png" alt="KOMPRENO footer logo" />
        <small>{{ props.text.footer.designed }} {{ props.text.footer.provider }}</small>
      </div>

      <div class="footer-right">
        © {{ new Date().getFullYear() }} KOMPRENO · {{ props.text.footer.rights }}
      </div>
    </div>
  </footer>
</template>
