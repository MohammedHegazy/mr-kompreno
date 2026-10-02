<script setup lang="ts">
import type { Locale } from '~/data/menu'

type LoaderPhase = 'loading' | 'exiting' | 'done'

const LOGO_SRC = '/images/logo/logo-without-background.png'
const SESSION_KEY = 'kompreno.loader.seen'
const MIN_DURATION = 1600
const MAX_DURATION = 4500
const EXIT_DURATION = 1150
const REDUCED_MIN_DURATION = 260

const { locale, dir } = useKompLocale()

const stages: Record<Locale, string[]> = {
  en: ['Warming the oven', 'Stretching the dough', 'Loading the toppings', 'Setting the table'],
  ar: ['تسخين الفرن', 'مدّ العجين', 'إضافة المكونات', 'تجهيز الطاولة'],
}

const phase = ref<LoaderPhase>('loading')
const progress = ref(0)
const stageIndex = ref(0)

const activeStage = computed(() => {
  const list = stages[locale.value]
  return list[Math.min(stageIndex.value, list.length - 1)]
})

const percentLabel = computed(() => String(Math.min(100, Math.round(progress.value))).padStart(3, '0'))

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

let animationFrame = 0
let exitTimeout = 0
let maxTimeout = 0
let keyHandler: ((event: KeyboardEvent) => void) | null = null
let previousOverflow: string | null = null
let previousPadding: string | null = null

const lockScroll = () => {
  const gap = window.innerWidth - document.documentElement.clientWidth
  previousOverflow = document.body.style.overflow
  previousPadding = document.body.style.paddingInlineEnd
  document.body.style.overflow = 'hidden'
  if (gap > 0) document.body.style.paddingInlineEnd = `${gap}px`
}

const unlockScroll = () => {
  if (previousOverflow === null) return
  document.body.style.overflow = previousOverflow
  document.body.style.paddingInlineEnd = previousPadding ?? ''
  previousOverflow = null
  previousPadding = null
}

const preload = (src: string, onSettle: () => void) => new Promise<void>((resolve) => {
  const image = new Image()
  let settled = false

  const finish = () => {
    if (settled) return
    settled = true
    onSettle()
    resolve()
  }

  image.onload = () => {
    const decoded = typeof image.decode === 'function' ? image.decode().catch(() => {}) : Promise.resolve()
    decoded.then(finish, finish)
  }
  image.onerror = finish
  image.src = src

  if (image.complete) finish()
})

const startExit = () => {
  if (phase.value !== 'loading') return

  progress.value = 1
  phase.value = 'exiting'
  unlockScroll()

  if (!prefersReducedMotion()) document.documentElement.classList.add('loader-reveal')

  exitTimeout = window.setTimeout(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* storage unavailable, loader simply shows again next visit */
    }
    document.documentElement.classList.remove('loader-reveal')
    phase.value = 'done'
  }, prefersReducedMotion() ? 60 : EXIT_DURATION)
}

onMounted(async () => {
  if (document.documentElement.getAttribute('data-loader') === 'off') {
    phase.value = 'done'
    return
  }

  const reduced = prefersReducedMotion()
  const floor = reduced ? REDUCED_MIN_DURATION : MIN_DURATION
  const startedAt = performance.now()

  lockScroll()

  keyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') startExit()
  }
  window.addEventListener('keydown', keyHandler)

  const sources = [LOGO_SRC]
  const spotlight = document.querySelector<HTMLImageElement>('.hero-frame img')
  const spotlightSrc = spotlight?.currentSrc || spotlight?.src
  if (spotlightSrc) sources.push(spotlightSrc)

  let settledAssets = 0
  let isReady = false

  const work = Promise.all([
    ...sources.map((src) => preload(src, () => { settledAssets += 1 })),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ])

  const expiry = new Promise<void>((resolve) => {
    maxTimeout = window.setTimeout(resolve, MAX_DURATION)
  })

  Promise.race([work, expiry]).then(() => {
    isReady = true
  })

  const tick = (now: number) => {
    const elapsed = now - startedAt
    const rampWindow = Math.max(240, floor - 240)
    const linear = Math.min(1, Math.max(0, (elapsed - 240) / rampWindow))
    const eased = linear * linear * (3 - 2 * linear)
    const loaded = settledAssets / Math.max(1, sources.length)
    const target = isReady ? 1 : Math.max(eased, loaded) * 0.96

    progress.value = reduced ? target : progress.value + (target - progress.value) * (isReady ? 0.18 : 0.11)

    const list = stages[locale.value]
    stageIndex.value = Math.min(list.length - 1, Math.floor((progress.value / 100) * list.length))

    if (isReady && progress.value >= (reduced ? 1 : 0.995)) {
      startExit()
      return
    }

    animationFrame = window.requestAnimationFrame(tick)
  }

  animationFrame = window.requestAnimationFrame(tick)
})

onUnmounted(() => {
  window.cancelAnimationFrame(animationFrame)
  window.clearTimeout(exitTimeout)
  window.clearTimeout(maxTimeout)
  if (keyHandler) window.removeEventListener('keydown', keyHandler)
  document.documentElement.classList.remove('loader-reveal')
  unlockScroll()
})
</script>

<template>
  <div
    v-if="phase !== 'done'"
    class="brand-loader"
    :class="[`brand-loader--${phase}`, `brand-loader--${dir}`]"
    :dir="dir"
    :style="{ '--loader-progress': progress }"
    data-brand-loader
    role="status"
    aria-live="polite"
  >
    <span class="brand-loader__curtain brand-loader__curtain--top" aria-hidden="true" />
    <span class="brand-loader__curtain brand-loader__curtain--bottom" aria-hidden="true" />

    <span class="brand-loader__field" aria-hidden="true">
      <span class="brand-loader__glow" />
      <span class="brand-loader__ring brand-loader__ring--outer" />
      <span class="brand-loader__ring brand-loader__ring--inner" />
      <span class="brand-loader__grain" />
    </span>

    <div class="brand-loader__inner">
      <div class="brand-loader__rail">
        <span class="brand-loader__rail-item">Digital Menu</span>
        <span class="brand-loader__rail-rule" aria-hidden="true" />
        <span class="brand-loader__rail-item brand-loader__rail-item--locale">
          {{ locale === 'ar' ? 'العربية' : 'English' }}
        </span>
      </div>

      <div class="brand-loader__stage">
        <span class="brand-loader__burner" aria-hidden="true" />
        <span class="brand-loader__burner brand-loader__burner--halo" aria-hidden="true" />

        <span class="brand-loader__mark">
          <img :src="LOGO_SRC" alt="" width="280" height="270" decoding="async" />
        </span>

        <p class="brand-loader__title">MR.KOMPRENO</p>

        <Transition name="loader-stage" mode="out-in">
          <span :key="activeStage" class="brand-loader__status">
            <span class="brand-loader__dot" aria-hidden="true" />
            {{ activeStage }}
          </span>
        </Transition>
      </div>

      <div class="brand-loader__foot">
        <div
          class="brand-loader__track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(progress)"
        >
          <span class="brand-loader__fill" />
          <span class="brand-loader__shine" aria-hidden="true" />
        </div>

        <span class="brand-loader__percent">{{ percentLabel }}<small>%</small></span>
      </div>
    </div>
  </div>
</template>
