/** Chapters in the order a visitor actually meets them, so 01–04 always agrees. */
export const CHAPTER_ORDER = ['home', 'about', 'menu', 'contact'] as const

/**
 * Reports which anchored chapter currently owns the viewport, plus how far
 * through it the visitor has travelled.
 *
 * A band across the middle of the viewport keeps exactly one chapter active.
 * The side rail and the header navigation both read this, which is what keeps
 * the rail gauge and the header highlight in lockstep instead of drifting.
 */
export const useActiveSection = (order: readonly string[] = CHAPTER_ORDER) => {
  const activeIndex = ref(0)
  const travel = ref(0)
  const visible = ref(false)

  const activeId = computed(() => order[activeIndex.value] ?? order[0] ?? '')

  const clamp = (value: number) => Math.min(1, Math.max(0, value))

  let frame = 0
  let observer: IntersectionObserver | null = null
  let tracked: HTMLElement | null = null

  const update = () => {
    frame = 0

    visible.value = window.scrollY > window.innerHeight * 0.5

    if (!tracked) {
      travel.value = 0
      return
    }

    const rect = tracked.getBoundingClientRect()

    travel.value = rect.height > 0 ? clamp((window.innerHeight * 0.5 - rect.top) / rect.height) : 0
  }

  const schedule = () => {
    if (frame) return

    frame = window.requestAnimationFrame(update)
  }

  const track = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue

      tracked = entry.target as HTMLElement

      const index = order.indexOf(tracked.id)

      if (index >= 0) activeIndex.value = index
    }

    schedule()
  }

  onMounted(() => {
    observer = new IntersectionObserver(track, { rootMargin: '-45% 0px -45% 0px', threshold: 0 })

    for (const id of order) {
      const element = document.getElementById(id)

      if (!element) continue

      observer.observe(element)

      if (!tracked) tracked = element
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    update()
  })

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)

    if (frame) window.cancelAnimationFrame(frame)
  })

  return { activeId, activeIndex, travel, visible }
}