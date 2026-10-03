<script setup lang="ts">
import BrandMotionBackground from './BrandMotionBackground.vue'
import { contactChannels, featuredProducts, navItems } from '~/data/menu'
import type { Locale } from '~/data/menu'

const RING_RADIUS = 19
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

const props = defineProps<{
  text: Record<string, any>
  socialLinks: Array<{ label: string; href: string; icon: string }>
  locale: Locale
}>()

const emit = defineEmits<{ (e: 'switch-locale', value: Locale): void }>()

const year = new Date().getFullYear()

const { progress: scrollProgress, past: canScrollTop } = useScrollProgress(320)

const sectionLinks = computed(() => navItems.map((item) => ({
  id: item.id,
  label: props.locale === 'ar' ? item.ar : item.en,
})))

const channels = computed(() => contactChannels.map((channel) => ({
  ...channel,
  label: props.text.contact[channel.key],
})))

// The three featured plates double as the footer's editorial recommendation.
const picks = computed(() => featuredProducts.map((product) => ({
  id: product.id,
  name: product.name[props.locale],
  price: product.price,
})))

const ringOffset = computed(() => RING_LENGTH * (1 - scrollProgress.value))

const scrollToTop = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}

const switchLocale = () => {
  emit('switch-locale', props.locale === 'ar' ? 'en' : 'ar')
}
</script>

<template>
  <footer class="footer">
    <BrandMotionBackground variant="ember" />

    <div class="container footer-lede">
      <a
        href="#home"
        class="footer-lede__mark"
        :aria-label="`${props.text.hero.eyebrow} — ${props.text.nav.home}`"
        v-reveal="{ from: 'scale', distance: 12, duration: 1000, ease: 'snap' }"
      >
        <SkeletonImage src="/images/logo/logo-without-background.png" alt="" :width="280" :height="270" />
        <span class="footer-lede__wordmark">{{ props.text.hero.eyebrow }}</span>
      </a>

      <div class="footer-lede__copy">
        <p
          class="footer-lede__eyebrow"
          v-reveal="{ from: 'up', distance: 14, duration: 900, delay: 80 }"
        >
          {{ props.text.footer.eyebrow }}
        </p>

        <h2
          class="footer-lede__title"
          v-reveal="{ from: 'up', distance: 30, duration: 1100, delay: 160, ease: 'expo' }"
        >{{ props.text.hero.title }}</h2>

        <p
          class="footer-lede__text"
          v-reveal="{ from: 'up', distance: 20, duration: 1000, delay: 260 }"
        >{{ props.text.hero.subtitle }}</p>
      </div>

      <a
        class="footer-lede__cta"
        href="#menu"
        v-reveal="{ from: 'up', distance: 20, duration: 1000, delay: 340, ease: 'soft' }"
      >
        <span>{{ props.text.hero.primary }}</span>
        <Icon name="lucide:arrow-up-right" class="footer-lede__cta-icon" aria-hidden="true" />
      </a>
    </div>

    <div class="container footer-grid">
      <div class="footer-cell footer-cell--brand">
        <p
          class="footer-cell__body"
          v-reveal="{ from: 'up', distance: 20, duration: 1000, delay: 80 }"
        >{{ props.text.about.body }}</p>

        <p
          class="footer-cell__highlight"
          v-reveal="{ from: 'up', distance: 18, duration: 1000, delay: 180 }"
        >{{ props.text.about.highlight }}</p>

        <ul class="footer-social">
          <li
            v-for="link in props.socialLinks"
            :key="link.label"
            v-reveal="{ from: 'scale', distance: 18, duration: 800, delay: 260, stagger: 70, ease: 'snap' }"
          >
            <a
              class="footer-social__link"
              :href="link.href"
              target="_blank"
              rel="noreferrer"
              :aria-label="`${props.text.footer.follow} — ${link.label}`"
            >
              <Icon :name="link.icon" class="footer-social__icon" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>

      <nav class="footer-cell" :aria-label="props.text.footer.navigate">
        <h3
          class="footer-cell__label"
          v-reveal="{ from: 'up', distance: 16, duration: 900, delay: 100 }"
        >
          <span class="footer-cell__index">01</span>
          {{ props.text.footer.navigate }}
        </h3>

        <ul class="footer-list">
          <li
            v-for="link in sectionLinks"
            :key="link.id"
            v-reveal="{ from: 'up', distance: 18, duration: 900, delay: 160, stagger: 60 }"
          >
            <a class="footer-link" :href="`#${link.id}`">
              <span class="footer-link__label">{{ link.label }}</span>
              <Icon name="lucide:arrow-up-right" class="footer-link__icon" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </nav>

      <div class="footer-cell">
        <h3
          class="footer-cell__label"
          v-reveal="{ from: 'up', distance: 16, duration: 900, delay: 140 }"
        >
          <span class="footer-cell__index">02</span>
          {{ props.text.footer.signature }}
        </h3>

        <ul class="footer-picks">
          <li
            v-for="pick in picks"
            :key="pick.id"
            v-reveal="{ from: 'up', distance: 18, duration: 900, delay: 200, stagger: 70 }"
          >
            <a class="footer-pick" href="#menu">
              <span class="footer-pick__name">{{ pick.name }}</span>
              <span class="footer-pick__rule" aria-hidden="true" />
              <bdi class="footer-pick__price">{{ pick.price }}</bdi>
            </a>
          </li>
        </ul>

        <span
          class="footer-cell__note"
          v-reveal="{ from: 'up', distance: 14, duration: 900, delay: 440 }"
        >{{ props.text.menu.priceLabel }}</span>
      </div>

      <div class="footer-cell">
        <h3
          class="footer-cell__label"
          v-reveal="{ from: 'up', distance: 16, duration: 900, delay: 180 }"
        >
          <span class="footer-cell__index">03</span>
          {{ props.text.footer.connect }}
        </h3>

        <ul class="footer-channels">
          <li
            v-for="channel in channels"
            :key="channel.key"
            v-reveal="{ from: 'up', distance: 20, duration: 900, delay: 240, stagger: 70 }"
          >
            <a
              class="footer-channel"
              :href="channel.href"
              :target="channel.external ? '_blank' : undefined"
              :rel="channel.external ? 'noreferrer' : undefined"
            >
              <span class="footer-channel__plate">
                <Icon :name="channel.icon" class="footer-channel__icon" aria-hidden="true" />
              </span>
              <span class="footer-channel__text">
                <small class="footer-channel__label">{{ channel.label }}</small>
                <bdi class="footer-channel__value">{{ channel.value }}</bdi>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="footer-echo" aria-hidden="true">
      <span class="footer-echo__ghost" dir="ltr">MR. KOMPRENO</span>
      <span class="footer-echo__solid" dir="ltr">MR. KOMPRENO</span>
    </div>

    <div class="container footer-base">
      <p class="footer-base__legal">
        <span>&copy; {{ year }} MR.KOMPRENO</span>
        <span class="footer-base__dot" aria-hidden="true">&middot;</span>
        <span>{{ props.text.footer.rights }}</span>
      </p>

      <p class="footer-base__credit">
        {{ props.text.footer.designed }}
        <span class="footer-base__provider">{{ props.text.footer.provider }}</span>
      </p>

      <div class="footer-base__tools">
        <button
          class="footer-lang"
          type="button"
          :aria-label="props.locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'"
          @click="switchLocale"
        >
          <Icon name="lucide:languages" class="footer-lang__icon" aria-hidden="true" />
          <span aria-hidden="true">{{ props.locale === 'ar' ? 'EN' : 'العربية' }}</span>
        </button>
      </div>
    </div>
  </footer>

  <Teleport to="body">
    <button
      class="footer-top"
      type="button"
      :class="{ 'is-visible': canScrollTop }"
      :aria-label="props.text.footer.backToTop"
      :tabindex="canScrollTop ? undefined : -1"
      @click="scrollToTop"
    >
      <svg class="footer-top__ring" viewBox="0 0 44 44" aria-hidden="true">
        <circle class="footer-top__track" cx="22" cy="22" :r="RING_RADIUS" />
        <circle
          class="footer-top__fill"
          cx="22"
          cy="22"
          :r="RING_RADIUS"
          :style="{ strokeDasharray: RING_LENGTH, strokeDashoffset: ringOffset }"
        />
      </svg>
      <Icon name="lucide:arrow-up" class="footer-top__icon" aria-hidden="true" />
    </button>
  </Teleport>
</template>