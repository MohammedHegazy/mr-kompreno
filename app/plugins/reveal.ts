import type { Directive } from 'vue'
import { observeLiveness, releaseLiveness } from '~/utils/liveness.client'

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

/**
 * How long an element may sit in view without being reported before it is
 * opened by hand. An IntersectionObserver with a negative bottom margin can
 * legally drop a callback — a scroller that never settles, a tab restored from
 * bfcache mid-frame, a category swap that remounts a node already past the
 * trigger line. Nothing in the spec promises a callback. The bug this replaces
 * hid product photography permanently at every viewport, and a deadline cannot
 * do that.
 */
const ELEMENT_BACKSTOP = 2600

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

/**
 * Content that disappears rather than merely sits offset. A curtain reveal
 * clips itself; a card's own reveal origin is a transform, but the `.card-media`
 * inside it is clipped independently, so both shapes have to be caught.
 */
const CLIPPED_SELECTOR = '[data-reveal="curtain"], .card-media'

let observer: IntersectionObserver | null = null
let armed = false
let settled = false
const queued = new Set<HTMLElement>()

/** Elements the observer has not reported into view yet. */
const pending = new Set<HTMLElement>()
let sweepFrame = 0

/**
 * Ambient loops repaint on every frame, so they only run while near the
 * viewport. Cards are gone from this list: their motion layer was static CSS,
 * so there is nothing left to pause and everything left to animate.
 */
const LIVE_SELECTOR = '.brand-motion'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True when the element is actually on screen, by geometry rather than by callback. */
const onScreen = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0
}

/**
 * True when the reader has already gone past the element, or is looking at it.
 *
 * The bottom edge is deliberately not included. Content still below the fold has
 * not been reached and keeps its animation until the reader arrives. The top
 * edge is the one that matters: a fast flick, a scrollbar drag or a programmatic
 * jump can move the viewport further than one element is tall between two
 * frames, and an element only ever evaluated at the resting position then looks
 * permanently off screen. It stays pending, the sweep skips it every time, and
 * the photograph is never shown at all. Treating "above the fold" as reached
 * costs nothing — the reader has already been past it — and closes that hole.
 */
const reached = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  return rect.bottom <= 0 || onScreen(element)
}

const show = (element: HTMLElement) => {
  element.classList.add('is-inview', 'is-revealing')
  observer?.unobserve(element)
  pending.delete(element)
  window.clearTimeout(Number(element.dataset.revealTimer ?? 0))
  delete element.dataset.revealTimer

  // Promote only for the length of the transition. A permanent `will-change`
  // on a few hundred elements is a few hundred extra compositor layers held
  // for the life of the session.
  const duration = Number(element.style.getPropertyValue('--reveal-duration').replace('ms', '')) || 900
  window.setTimeout(() => element.classList.remove('is-revealing'), duration + 120)

  queued.delete(element)
}

/**
 * Opens an element the observer never reported.
 *
 * The clipped shapes are flagged so the stylesheet resolves them with no
 * transition: animating something that is already on screen reads as a glitch,
 * and a clipped photograph is the difference between a card and a hole in the
 * page.
 */
const open = (element: HTMLElement) => {
  if (element.matches(CLIPPED_SELECTOR) || element.querySelector(CLIPPED_SELECTOR)) {
    element.setAttribute('data-reveal-stranded', '')
  }

  show(element)
}

/**
 * Geometry sweep, run on scroll and resize.
 *
 * A deadline alone is not enough, and was actively harmful when used as one: it
 * fired for every element below the fold, which meant content the reader had
 * not reached yet was already resolved and popped in without animating when
 * they got there. So the deadline only opens an element that is genuinely in
 * view, and this sweep covers the case where the page never scrolls again and
 * the initial deadline has already lapsed.
 */
const sweep = () => {
  sweepFrame = 0

  for (const element of [...pending]) {
    if (!reached(element)) continue
    open(element)
  }
}

const scheduleSweep = () => {
  if (sweepFrame) return
  sweepFrame = window.requestAnimationFrame(sweep)
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
  pending.add(element)

  if (element.dataset.revealTimer) return

  const delay = Number(element.style.getPropertyValue('--reveal-delay').replace('ms', '')) || 0

  element.dataset.revealTimer = String(window.setTimeout(() => {
    delete element.dataset.revealTimer

    if (element.classList.contains('is-inview')) return

    // Still below the fold: not missed, just not reached. Leave it pending so
    // the sweep opens it with its animation intact when the reader gets there.
    if (!onScreen(element)) return

    open(element)
  }, delay + ELEMENT_BACKSTOP))

  scheduleSweep()
}

/**
 * Reveals only start once the runtime flags itself ready, so a failure in the
 * loader can never leave a section stranded in its hidden state.
 */
const arm = () => {
  if (armed) return
  armed = true

  document.documentElement.classList.add('reveal-ready')

  for (const element of document.querySelectorAll<HTMLElement>(LIVE_SELECTOR)) observeLiveness(element)

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

  if (element.matches(LIVE_SELECTOR)) observeLiveness(element)
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
    pending.delete(element)
    observer?.unobserve(element)
    releaseLiveness(element)
    window.clearTimeout(Number(element.dataset.revealTimer ?? 0))
    delete element.dataset.revealTimer
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', reveal)

  if (!import.meta.client) return

  // The sweep is the safety net the observer cannot be. Both are passive and
  // rAF-throttled, so a scroll costs one style read per pending element rather
  // than a layout pass per reveal.
  window.addEventListener('scroll', scheduleSweep, { passive: true })
  window.addEventListener('resize', scheduleSweep, { passive: true })

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
