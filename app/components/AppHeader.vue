<script setup lang="ts">
import type { Locale } from '~/data/menu'

const isMenuOpen = ref(false)
const isScrolled = ref(false)
const menuToggle = ref<HTMLButtonElement | null>(null)
const mobileMenu = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const previousBodyOverflow = ref<string | null>(null)

const props = defineProps<{ locale: Locale; text: Record<string, any>; navItems: Array<{ id: string; en: string; ar: string }> }>()

const emit = defineEmits<{ (e: 'switch-locale', value: Locale): void }>()

const localizedNav = computed(() => props.navItems.map((item) => ({
  id: item.id,
  label: props.locale === 'ar' ? item.ar : item.en,
  href: `#${item.id}`,
})))

const switchLocale = () => {
  emit('switch-locale', props.locale === 'ar' ? 'en' : 'ar')
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

const updateScrollState = () => {
  const scrollY = window.scrollY

  if (!isScrolled.value && scrollY > 48) isScrolled.value = true
  else if (isScrolled.value && scrollY < 16) isScrolled.value = false
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
  updateScrollState()
  window.addEventListener('scroll', updateScrollState, { passive: true })
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollState)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  if (previousBodyOverflow.value !== null) document.body.style.overflow = previousBodyOverflow.value
})
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="container header-inner">
      <BrandMotionBackground variant="hero" />

      <a href="#home" class="brand-mark" aria-label="KOMPRENO home">
        <img src="/images/logo/logo-without-background.png" alt="KOMPRENO logo" />
        <span class="brand-name">Mr.Kompreno</span>
      </a>

      <nav id="main-navigation" class="nav-links" aria-label="Main navigation">
        <a v-for="item in localizedNav" :key="item.id" :href="item.href" @click="closeMenu">{{ item.label }}</a>
      </nav>

      <div class="header-actions">
        <a class="header-cta" href="#menu" @click="closeMenu">
          <Icon name="lucide:utensils" class="action-icon" aria-hidden="true" />
          {{ text.hero.primary }}
        </a>

        <button
          class="language-switch"
          type="button"
          :aria-label="locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'"
          :title="locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'"
          @click="switchLocale"
        >
          <Icon name="lucide:languages" class="language-icon" aria-hidden="true" />
          <span aria-hidden="true">{{ locale === 'ar' ? 'EN' : 'ع' }}</span>
        </button>

        <button
          class="nav-toggle"
          ref="menuToggle"
          type="button"
          aria-controls="mobile-navigation"
          :aria-label="isMenuOpen ? (locale === 'ar' ? 'إغلاق القائمة' : 'Close menu') : (locale === 'ar' ? 'فتح القائمة' : 'Open menu')"
          :aria-expanded="isMenuOpen"
          @click="toggleMenu"
        >
          <Icon :name="isMenuOpen ? 'lucide:x' : 'lucide:menu'" class="nav-icon" aria-hidden="true" />
        </button>
      </div>
    </div>

    <Transition name="mobile-drawer">
      <div v-if="isMenuOpen" class="mobile-menu-overlay" @click.self="closeMenu">
        <nav
          id="mobile-navigation"
          ref="mobileMenu"
          class="mobile-menu-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="locale === 'ar' ? 'القائمة الرئيسية' : 'Main menu'"
        >
          <BrandMotionBackground variant="ember" />

          <div class="mobile-menu-top">
            <span>{{ locale === 'ar' ? 'القائمة' : 'Menu' }}</span>
            <button
              ref="closeButton"
              class="mobile-menu-close"
              type="button"
              :aria-label="locale === 'ar' ? 'إغلاق القائمة' : 'Close menu'"
              @click="closeMenu"
            >
              <Icon name="lucide:x" class="mobile-menu-close-icon" aria-hidden="true" />
            </button>
          </div>
          <a v-for="item in localizedNav" :key="item.id" :href="item.href" @click="closeMenu">{{ item.label }}</a>
          <a class="mobile-menu-cta" href="#menu" @click="closeMenu">
            <Icon name="lucide:utensils" class="action-icon" aria-hidden="true" />
            {{ text.hero.primary }}
          </a>
        </nav>
      </div>
    </Transition>
  </header>
</template>
