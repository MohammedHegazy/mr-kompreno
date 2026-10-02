<script setup lang="ts">
type SkeletonState = 'loading' | 'loaded' | 'failed'

const props = defineProps<{
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  sizes?: string
}>()

const image = ref<HTMLImageElement | null>(null)
const state = ref<SkeletonState>('loading')

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
  <span class="skeleton-image" :class="`is-${state}`">
    <img
      ref="image"
      class="skeleton-image__img"
      :src="props.src"
      :alt="props.alt ?? ''"
      :width="props.width"
      :height="props.height"
      :sizes="props.sizes"
      loading="lazy"
      decoding="async"
      @load="markLoaded"
      @error="markFailed"
    />
    <span class="skeleton-image__shimmer" aria-hidden="true" />
  </span>
</template>