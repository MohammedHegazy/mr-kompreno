/**
 * Whole-document scroll progress, 0 at the very top and 1 at the bottom.
 *
 * The header hairline and the footer ring read from the same signal, so the
 * two controls can never disagree about how far through the page the visitor
 * is. Reads are batched into one animation frame because every scroll event
 * would otherwise force a layout.
 */
export const useScrollProgress = (threshold = 0) => {
  const progress = ref(0)
  const past = ref(false)

  let frame = 0

  const measure = () => {
    frame = 0

    const scrollTop = window.scrollY
    const scrollable = document.documentElement.scrollHeight - window.innerHeight

    past.value = scrollTop > threshold
    progress.value = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0
  }

  const schedule = () => {
    if (frame) return

    frame = window.requestAnimationFrame(measure)
  }

  onMounted(() => {
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)

    if (frame) window.cancelAnimationFrame(frame)
  })

  return { progress, past }
}