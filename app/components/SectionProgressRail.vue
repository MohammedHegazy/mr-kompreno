<script setup lang="ts">
const props = defineProps<{ items: Array<{ id: string; label: string }> }>()

const fill = ref(0)
const activeIndex = ref(0)
const visible = ref(false)

const activeItem = computed(() => props.items[activeIndex.value] ?? props.items[0])

const span = computed(() => Math.max(1, props.items.length - 1))

const clamp = (value: number) => Math.min(1, Math.max(0, value))

let frame = 0
let observer: IntersectionObserver | null = null
let tracked: HTMLElement | null = null

const update = () => {
  frame = 0
  visible.value = window.scrollY > window.innerHeight * 0.5

  if (!tracked) return

  const rect = tracked.getBoundingClientRect()
  const travel = rect.height > 0 ? clamp((window.innerHeight * 0.5 - rect.top) / rect.height) : 0

  fill.value = clamp((activeIndex.value + travel) / span.value)
}

const schedule = () => {
  if (frame) return
  frame = window.requestAnimationFrame(update)
}

const track = (entries: IntersectionObserverEntry[]) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue

    tracked = entry.target as HTMLElement

    const index = props.items.findIndex((item) => item.id === tracked?.id)

    if (index >= 0) activeIndex.value = index
  }

  schedule()
}

onMounted(() => {
  // A band across the middle of the viewport keeps exactly one section active.
  observer = new IntersectionObserver(track, { rootMargin: '-45% 0px -45% 0px', threshold: 0 })

  for (const item of props.items) {
    const element = document.getElementById(item.id)

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
</script>

<template>
  <aside
    class="section-rail"
    :class="{ 'is-visible': visible }"
    :style="{ '--rail-items': props.items.length }"
    aria-hidden="true"
  >
    <Transition name="rail-label">
      <span v-if="activeItem" :key="activeItem.id" class="section-rail__label">{{ activeItem.label }}</span>
    </Transition>

    <div class="section-rail__gauge">
      <span class="section-rail__track">
        <span class="section-rail__fill" :style="{ scale: `1 ${fill}` }" />
      </span>

      <span
        v-for="(item, index) in props.items"
        :key="item.id"
        class="section-rail__tick"
        :class="{ 'is-active': index === activeIndex }"
      >
        <span class="section-rail__dot" />
        <span class="section-rail__index">{{ String(index + 1).padStart(2, '0') }}</span>
      </span>
    </div>
  </aside>
</template>