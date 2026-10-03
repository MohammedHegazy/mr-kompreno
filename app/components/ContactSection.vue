<script setup lang="ts">
import { contactChannels } from '~/data/menu'

const props = defineProps<{ text: Record<string, any>; socialLinks: Array<{ label: string; href: string; icon: string }> }>()

const channels = computed(() => contactChannels.map((channel) => ({
  ...channel,
  label: props.text.contact[channel.key],
})))
</script>

<template>
  <section id="contact" class="section">
    <div class="container">
      <div class="contact-panel" v-reveal="{ from: 'up', distance: 58, duration: 1200, ease: 'soft' }">
        <div>
          <SectionHead
            :eyebrow="props.text.contact.eyebrow"
            :title="props.text.contact.title"
            index="04"
            tone="dark"
          />

          <p v-reveal="{ from: 'up', distance: 22, duration: 1000, delay: 220 }">
            {{ props.text.about.body }}
          </p>

          <div class="social-links">
            <a
              v-for="link in props.socialLinks"
              :key="link.label"
              class="social-link"
              :href="link.href"
              target="_blank"
              rel="noreferrer"
              v-reveal="{ from: 'up', distance: 16, duration: 800, delay: 300, stagger: 80 }"
            >
              <Icon :name="link.icon" class="social-icon" aria-hidden="true" />
              <span>{{ link.label }}</span>
            </a>
          </div>
        </div>

        <div class="contact-list">
          <a
            v-for="channel in channels"
            :key="channel.key"
            class="contact-item"
            :href="channel.href"
            :target="channel.external ? '_blank' : undefined"
            :rel="channel.external ? 'noreferrer' : undefined"
            v-reveal="{ from: 'end', distance: 34, duration: 900, delay: 260, stagger: 90 }"
          >
            <span class="contact-item-label">
              <Icon :name="channel.icon" class="contact-item-icon" aria-hidden="true" />
              <span>{{ channel.label }}</span>
            </span>
            <bdi class="contact-item-value">{{ channel.value }}</bdi>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>