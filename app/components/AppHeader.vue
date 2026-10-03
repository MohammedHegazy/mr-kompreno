<script setup lang="ts">
import BrandMotionBackground from './BrandMotionBackground.vue'
import { contactChannels, featuredProducts, menuCategories } from '~/data/menu'
import type { Locale } from '~/data/menu'

const props = defineProps<{
  text: Record<string, any>
  items: Array<{ id: string; label: string }>
  socialLinks: Array<{ label: string; href: string; icon: string }>
  activeId: string
  locale: Locale
}>()

const emit = defineEmits<{ (e: 'switch-locale', value: Locale): void }>()

const isMenuOpen = ref(false)
const menuToggle = ref<HTMLButtonElement | null>(null)
const mobileMenu = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const previousBodyOverflow = ref<string | null>(null)

const { past: isScrolled, progress } = useScrollProgress(48)

const languageOptions = [
  { value: 'en' as Locale, label: 'EN', lang: 'en' },
  { value: 'ar' as Locale, label: 'ع', lang: 'ar' },
]

const localizedNav = computed(() => props.items.map((item, index) => ({
  ...item,
  href: `#${item.id}`,
  index: String(index + 1).padStart(2, '0'),
})))

const categories = computed(() => menuCategories.filter((category) => category.id !== 'all'))

const picks = computed(() => featuredProducts.map((product) => ({
  id: product.id,
  name: product.name[props.locale],
  price: product.price,
})))

const channels = computed(() => contactChannels.map((channel) => ({
  ...channel,
  label: props.text.contact[channel.key],
})))

const selectLocale = (value: Locale) => {
  if (value === props.locale) return

  emit('switch-locale', value)
}

const openMenu = () => {
  isMenuOpen.value = true
  nextTick(() => closeButton.value?.focus())
}

const closeMenu = (restoreFocus = true) => {
  if (!isMenuOpen.value) return
  isMenuOpen.value = false
  if (restoreFocus) nextTick(() => menuToggle.value?.focus())
}

const toggleMenu = () => {
  if (isMenuOpen.value) closeMenu()
  else openMenu()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isMenuOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
    return
  }

  if (event.key !== 'Tab' || !mobileMenu.value) return
  const focusable = Array.from(mobileMenu.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

const handleResize = () => {
  if (window.innerWidth > 960 && isMenuOpen.value) closeMenu(false)
}

watch(isMenuOpen, (open) => {
  if (open) {
    previousBodyOverflow.value = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else if (previousBodyOverflow.value !== null) {
    document.body.style.overflow = previousBodyOverflow.value
    previousBodyOverflow.value = null
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  if (previousBodyOverflow.value !== null) document.body.style.overflow = previousBodyOverflow.value
})
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="header-inner">
      <BrandMotionBackground variant="hero" />

      <div class="header-track">
        <a
          href="#home"
          class="brand-mark"
          :aria-label="`${props.text.hero.eyebrow} — ${props.text.nav.home}`"
        >
          <span class="brand-mark__plate">
            <SkeletonImage src="/images/logo/logo-without-background.png" alt="" :width="280" :height="270" />
          </span>

          <span class="brand-mark__text">
            <strong class="brand-name">{{ props.text.hero.eyebrow }}</strong>
            <small class="brand-mark__tag">{{ props.text.footer.eyebrow }}</small>
          </span>
        </a>

        <nav
          id="main-navigation"
          class="nav-links"
          :aria-label="props.locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'"
        >
          <div
            v-for="item in localizedNav"
            :key="item.id"
            class="nav-item"
            :class="{ 'is-active': item.id === props.activeId, 'has-panel': item.id === 'menu' }"
          >
            <a
              class="nav-link"
              :href="item.href"
              :aria-current="item.id === props.activeId ? 'true' : undefined"
              @click="closeMenu"
            >
              <span class="nav-link__index" aria-hidden="true">{{ item.index }}</span>
              <span class="nav-link__label">{{ item.label }}</span>
            </a>

            <!-- Hover and keyboard focus open the panel from CSS alone, so the
                 trigger never has to hold state that can drift out of sync. -->
            <div v-if="item.id === 'menu'" class="nav-panel">
              <BrandMotionBackground variant="ember" />

              <div class="nav-panel__group">
                <span class="nav-panel__label">{{ props.text.menu.eyebrow }}</span>

                <ul class="nav-panel__list">
                  <li v-for="category in categories" :key="category.id">
                    <a class="nav-panel__link" href="#menu" @click="closeMenu">
                      <Icon :name="category.icon" class="nav-panel__icon" aria-hidden="true" />
                      <span>{{ category.name[props.locale] }}</span>
                    </a>
                  </li>
                </ul>
              </div>

              <div class="nav-panel__group">
                <span class="nav-panel__label">{{ props.text.footer.signature }}</span>

                <ul class="nav-panel__list">
                  <li v-for="pick in picks" :key="pick.id">
                    <a class="nav-panel__pick" href="#menu" @click="closeMenu">
                      <span class="nav-panel__pick-name">{{ pick.name }}</span>
                      <span class="nav-panel__rule" aria-hidden="true" />
                      <bdi class="nav-panel__pick-price">{{ pick.price }}</bdi>
                    </a>
                  </li>
                </ul>
              </div>

              <a class="nav-panel__cta" href="#menu" @click="closeMenu">
                <span>{{ props.text.hero.primary }}</span>
                <Icon name="lucide:arrow-up-right" class="nav-panel__cta-icon" aria-hidden="true" />
              </a>
            </div>
          </div>
        </nav>

        <div class="header-actions">
          <a class="header-cta" href="#menu" @click="closeMenu">
            <Icon name="lucide:utensils" class="action-icon" aria-hidden="true" />
            {{ props.text.hero.primary }}
          </a>

          <div
            class="language-switch"
            role="group"
            :aria-label="props.locale === 'ar' ? 'اللغة' : 'Language'"
          >
            <Icon name="lucide:languages" class="language-icon" aria-hidden="true" />

            <button
              v-for="option in languageOptions"
              :key="option.value"
              class="language-option"
              type="button"
              :class="{ 'is-active': props.locale === option.value }"
              :aria-pressed="props.locale === option.value"
              :lang="option.lang"
              @click="selectLocale(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <button
            class="nav-toggle"
            ref="menuToggle"
            type="button"
            aria-controls="mobile-navigation"
            :aria-label="isMenuOpen ? (props.locale === 'ar' ? 'إغلاق القائمة' : 'Close menu') : (props.locale === 'ar' ? 'فتح القائمة' : 'Open menu')"
            :aria-expanded="isMenuOpen"
            @click="toggleMenu"
          >
            <Icon :name="isMenuOpen ? 'lucide:x' : 'lucide:menu'" class="nav-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <span class="header-progress" aria-hidden="true">
        <span class="header-progress__fill" :style="{ scale: `${progress} 1` }" />
      </span>
    </div>

    <Transition name="mobile-drawer">
      <div v-if="isMenuOpen" class="mobile-menu-overlay" @click.self="closeMenu">
        <nav
          id="mobile-navigation"
          ref="mobileMenu"
          class="mobile-menu-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="props.locale === 'ar' ? 'القائمة الرئيسية' : 'Main menu'"
        >
          <BrandMotionBackground variant="ember" />

          <div class="mobile-menu-top">
            <span class="mobile-menu-kicker">{{ props.text.footer.eyebrow }}</span>
            <button
              ref="closeButton"
              class="mobile-menu-close"
              type="button"
              :aria-label="props.locale === 'ar' ? 'إغلاق القائمة' : 'Close menu'"
              @click="closeMenu"
            >
              <Icon name="lucide:x" class="mobile-menu-close-icon" aria-hidden="true" />
            </button>
          </div>

          <ul class="mobile-menu-list">
            <li v-for="item in localizedNav" :key="item.id">
              <a
                class="mobile-menu-link"
                :href="item.href"
                :class="{ 'is-active': item.id === props.activeId }"
                :aria-current="item.id === props.activeId ? 'true' : undefined"
                @click="closeMenu"
              >
                <span class="mobile-menu-link__index" aria-hidden="true">{{ item.index }}</span>
                <span class="mobile-menu-link__label">{{ item.label }}</span>
                <Icon name="lucide:arrow-up-right" class="mobile-menu-link__icon" aria-hidden="true" />
              </a>
            </li>
          </ul>

          <div class="mobile-menu-block">
            <span class="mobile-menu-kicker">{{ props.text.menu.eyebrow }}</span>

            <div class="mobile-menu-categories">
              <a
                v-for="category in categories"
                :key="category.id"
                class="mobile-menu-chip"
                href="#menu"
                @click="closeMenu"
              >
                <Icon :name="category.icon" class="mobile-menu-chip__icon" aria-hidden="true" />
                {{ category.name[props.locale] }}
              </a>
            </div>
          </div>

          <div class="mobile-menu-block">
            <span class="mobile-menu-kicker">{{ props.text.footer.connect }}</span>

            <div class="mobile-menu-channels">
              <a
                v-for="channel in channels"
                :key="channel.key"
                class="mobile-menu-channel"
                :href="channel.href"
                :target="channel.external ? '_blank' : undefined"
                :rel="channel.external ? 'noreferrer' : undefined"
              >
                <Icon :name="channel.icon" class="mobile-menu-channel__icon" aria-hidden="true" />
                <bdi>{{ channel.value }}</bdi>
              </a>
            </div>

            <div class="mobile-menu-social">
              <a
                v-for="link in props.socialLinks"
                :key="link.label"
                class="mobile-menu-social__link"
                :href="link.href"
                target="_blank"
                rel="noreferrer"
                :aria-label="`${props.text.footer.follow} — ${link.label}`"
              >
                <Icon :name="link.icon" aria-hidden="true" />
              </a>
            </div>
          </div>

          <a class="mobile-menu-cta" href="#menu" @click="closeMenu">
            <Icon name="lucide:utensils" class="action-icon" aria-hidden="true" />
            {{ props.text.hero.primary }}
          </a>
        </nav>
      </div>
    </Transition>
  </header>
</template>