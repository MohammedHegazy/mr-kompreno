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
            <a class="contact-number" href="tel:+963955403020" dir="ltr">+963 955 403 020</a>
          </div>
          <div class="contact-item">
            <span>{{ props.text.contact.whatsapp }}</span>
            <a class="contact-whatsapp" href="https://wa.me/963955403020" target="_blank" rel="noreferrer" dir="ltr">
              <Icon name="simple-icons:whatsapp" class="contact-whatsapp-icon" aria-hidden="true" />
              <bdi>+963 955 403 020</bdi>
            </a>
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
