<script setup lang="ts">
const props = defineProps<{
  items: Array<{ id: string; label: string }>
  activeIndex: number
  travel: number
  visible: boolean
}>()

const activeItem = computed(() => props.items[props.activeIndex] ?? props.items[0])

const span = computed(() => Math.max(1, props.items.length - 1))

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const fill = computed(() => clamp((props.activeIndex + props.travel) / span.value))
</script>

<template>
  <aside
    class="section-rail"
    :class="{ 'is-visible': props.visible }"
    :style="{ '--rail-items': props.items.length }"
    aria-hidden="true"
  >
    <!-- Keyed, so every chapter remounts the pill and the CSS entrance replays. -->
    <span v-if="activeItem" :key="activeItem.id" class="section-rail__label">{{ activeItem.label }}</span>

    <div class="section-rail__gauge">
      <span class="section-rail__track">
        <span class="section-rail__fill" :style="{ scale: `1 ${fill}` }" />
      </span>

      <span
        v-for="(item, index) in props.items"
        :key="item.id"
        class="section-rail__tick"
        :class="{ 'is-active': index === props.activeIndex }"
      >
        <span class="section-rail__dot" />
        <span class="section-rail__index">{{ String(index + 1).padStart(2, '0') }}</span>
      </span>
    </div>
  </aside>
</template>