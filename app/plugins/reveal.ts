import type { Directive } from 'vue'

export type RevealOrigin = 'up' | 'down' | 'start' | 'end' | 'scale' | 'blur' | 'curtain'

export interface RevealOptions {
  /** Origin the element travels from before it lands. */
  from?: RevealOrigin
  /** Travel in px, or shrink amount in % when `from` is `scale`. */
  distance?: number
  /** Delay in ms before the choreography starts. */
  delay?: number
  /** Extra delay in ms for every preceding sibling marked for reveal. */
  stagger?: number
  /** Duration in ms of the reveal. */
  duration?: number
  /** Easing token, mapped onto a CSS custom property. */
  ease?: 'expo' | 'soft' | 'mask' | 'snap'
}

const READY_EVENT = 'kompreno:ready'
const ARM_FALLBACK = 8000

const DEFAULTS: Required<RevealOptions> = {
  from: 'up',
  distance: 32,
  delay: 0,
  stagger: 0,
  duration: 900,
  ease: 'expo',
}

const EASES: Record<NonNullable<RevealOptions['ease']>, string> = {
  expo: 'var(--reveal-ease-expo)',
  soft: 'var(--reveal-ease-soft)',
  mask: 'var(--reveal-ease-mask)',
  snap: 'var(--reveal-ease-snap)',
}

let observer: IntersectionObserver | null = null
let armed = false
let settled = false
const queued = new Set<HTMLElement>()

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const show = (element: HTMLElement) => {
  element.classList.add('is-inview')
  observer?.unobserve(element)
  queued.delete(element)
}

const watch = (element: HTMLElement) => {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show(entry.target as HTMLElement)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )
  }

  observer.observe(element)
}

/**
 * Reveals only start once the runtime flags itself ready, so a failure in the
 * loader can never leave a section stranded in its hidden state.
 */
const arm = () => {
  if (armed) return
  armed = true

  document.documentElement.classList.add('reveal-ready')

  if (prefersReducedMotion()) {
    queued.forEach(show)
    settled = true
  } else {
    queued.forEach(watch)
  }

  queued.clear()

  // Anything mounted after the opening sequence (category swaps, locale
  // changes) lands instantly, so reveals never stack on a running transition.
  requestAnimationFrame(() => {
    settled = true
  })
}

const configure = (element: HTMLElement, options: RevealOptions) => {
  const settings = { ...DEFAULTS, ...options }
  let delay = settings.delay

  if (settings.stagger > 0 && element.parentElement) {
    let index = 0

    for (const sibling of element.parentElement.children) {
      if (sibling === element) break
      if (sibling.hasAttribute('data-reveal')) index += 1
    }

    delay += index * settings.stagger
  }

  const style = element.style
  style.setProperty('--reveal-duration', `${settings.duration}ms`)
  style.setProperty('--reveal-delay', `${delay}ms`)
  style.setProperty('--reveal-ease', EASES[settings.ease])

  if (settings.from === 'scale') {
    style.setProperty('--reveal-scale', String((100 - settings.distance) / 100))
  } else if (settings.from === 'blur') {
    style.setProperty('--reveal-blur', `${Math.max(2, Math.round(settings.distance / 3))}px`)
  } else if (settings.from === 'start' || settings.from === 'end') {
    style.setProperty('--reveal-x', `${settings.distance}px`)
  } else {
    style.setProperty('--reveal-y', `${settings.distance}px`)
  }

  element.setAttribute('data-reveal', settings.from)
  element.classList.add('reveal')
}

const reveal: Directive<HTMLElement, RevealOptions | undefined> = {
  mounted(element, binding) {
    configure(element, binding.value ?? {})

    if (prefersReducedMotion()) {
      show(element)
      return
    }

    if (settled) {
      element.setAttribute('data-reveal-instant', '')
      show(element)
      return
    }

    // Arming can happen before the first mount when the loader is skipped, so
    // late arrivals join the observer instead of an already drained queue.
    if (armed) {
      watch(element)
      return
    }

    queued.add(element)
  },
  unmounted(element) {
    queued.delete(element)
    observer?.unobserve(element)
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', reveal)

  if (!import.meta.client) return

  // Keyboard users never scroll, so focus is treated as a reveal trigger.
  document.addEventListener('focusin', (event) => {
    const target = event.target

    if (!(target instanceof HTMLElement)) return

    const element = target.closest<HTMLElement>('[data-reveal]')

    if (element && !element.classList.contains('is-inview')) show(element)
  })

  if (document.documentElement.getAttribute('data-loader') === 'js') {
    window.addEventListener(READY_EVENT, arm, { once: true })
    window.setTimeout(arm, ARM_FALLBACK)
    return
  }

  arm()
})

declare module 'vue' {
  interface GlobalDirectives {
    vReveal: Directive<HTMLElement, RevealOptions | undefined>
  }
}