/**
 * Ambient loops repaint on every frame, so they only run while the element is
 * near the viewport.
 *
 * Fails open by construction: `is-idle` is only added once the observer has
 * positively reported the element off screen. Before that first report every
 * loop runs, so a lost callback costs a few frames instead of freezing the
 * decoration for the whole session.
 */
let observer: IntersectionObserver | null = null

const registered = new WeakSet<HTMLElement>()

export const observeLiveness = (element: HTMLElement) => {
  if (registered.has(element)) return
  registered.add(element)

  element.setAttribute('data-liveness', '')

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ;(entry.target as HTMLElement).classList.toggle('is-idle', !entry.isIntersecting)
        }
      },
      { rootMargin: '160px 0px 160px 0px', threshold: 0 },
    )
  }

  observer.observe(element)
}

export const releaseLiveness = (element: HTMLElement) => {
  if (!registered.has(element)) return
  registered.delete(element)
  observer?.unobserve(element)
}
