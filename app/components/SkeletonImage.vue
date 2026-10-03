<script setup lang="ts">
import derivatives from '~/generated/derivatives.json'

type SkeletonState = 'loading' | 'loaded' | 'failed'

const props = defineProps<{
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  sizes?: string
  /** Above-the-fold artwork opts out of lazy loading and shimmer. */
  priority?: boolean
}>()

const widths = derivatives as Record<string, number[]>

/** Product photography has derivatives; the logo plates are already tiny. */
const DERIVATABLE = /^\/items\/.+\.(jpe?g|png)$/i

const image = ref<HTMLImageElement | null>(null)
const state = ref<SkeletonState>('loading')

/**
 * A `srcset` of the derivatives that were actually written for this source, or
 * nothing at all for assets that have none. Without this a phone rendered a
 * 350px card by downloading the 1200px original, which is the single largest
 * avoidable cost on the page.
 *
 * The widths come from the generator's manifest rather than from a list written
 * out here. The two drifting apart is not theoretical: the generator refuses to
 * upscale, so the one 840px-wide portrait got 480/768/840 and no 1200, while this
 * component still offered a 1200w candidate. Every screen dense enough to want
 * that rung requested it, got a 404, and showed nothing.
 */
const sources = computed(() => {
  const available = widths[props.src]

  if (!DERIVATABLE.test(props.src) || !available?.length) return []

  const stem = props.src.replace(/\.(jpe?g|png)$/i, '')
  const build = (extension: string) => available
    .map((width) => `/items/responsive/${stem.split('/').pop()}-${width}.${extension} ${width}w`)
    .join(', ')

  return [
    { type: 'image/webp', srcset: build('webp') },
    { type: 'image/jpeg', srcset: build('jpg') },
  ]
})

const markLoaded = () => {
  state.value = 'loaded'
}

const markFailed = () => {
  state.value = 'failed'
}

// Category swaps hand a new source to the same instance, so the plate has to
// reopen instead of staying clear on the artwork that is still in flight.
watch(() => props.src, () => {
  state.value = 'loading'
})

onMounted(() => {
  const node = image.value

  // Hydration often lands after a cached image already settled, and a listener
  // attached now would never see the event it is waiting for.
  if (node?.complete) state.value = node.naturalWidth > 0 ? 'loaded' : 'failed'
})
</script>

<template>
  <span class="skeleton-image" :class="[`is-${state}`, { 'is-priority': props.priority }]">
    <picture>
      <source
        v-for="source in sources"
        :key="source.type"
        :type="source.type"
        :srcset="source.srcset"
        :sizes="props.sizes"
      />
      <img
        ref="image"
        class="skeleton-image__img"
        :src="props.src"
        :alt="props.alt ?? ''"
        :width="props.width"
        :height="props.height"
        :sizes="props.sizes"
        :loading="props.priority ? 'eager' : 'lazy'"
        :fetchpriority="props.priority ? 'high' : undefined"
        decoding="async"
        @load="markLoaded"
        @error="markFailed"
      />
    </picture>
    <span class="skeleton-image__shimmer" aria-hidden="true" />
  </span>
</template>
