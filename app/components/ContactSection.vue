<script setup lang="ts">
import BrandMotionBackground from './BrandMotionBackground.vue'

const props = defineProps<{ text: Record<string, any>; socialLinks: Array<{ label: string; href: string; icon: string }> }>()
</script>

<template>
  <section id="contact" class="section">
    <div class="container">
      <div class="contact-panel">
        <BrandMotionBackground variant="ember" />

        <div>
          <div class="section-head">
            <small>{{ props.text.contact.eyebrow }}</small>
            <h2>{{ props.text.contact.title }}</h2>
          </div>

          <p>{{ props.text.about.body }}</p>

          <div class="social-links">
            <a v-for="link in props.socialLinks" :key="link.label" :href="link.href" class="social-link" target="_blank" rel="noreferrer">
              <Icon :name="link.icon" class="social-icon" aria-hidden="true" />
              <span>{{ link.label }}</span>
            </a>
          </div>
        </div>

        <div class="contact-list">
          <div class="contact-item">
            <span>{{ props.text.contact.phone }}</span>
            <strong>{{ props.text.contact.pending }}</strong>
          </div>
          <div class="contact-item">
            <span>{{ props.text.contact.instagram }}</span>
            <strong>@mrkompreno</strong>
          </div>
          <div class="contact-item">
            <span>{{ props.text.contact.facebook }}</span>
            <strong>KOMPRENO.MR</strong>
          </div>
          <div class="contact-item">
            <span>{{ props.text.contact.website }}</span>
            <strong>mr-kompreno.com</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
