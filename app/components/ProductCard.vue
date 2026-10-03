<script setup lang="ts">
import { menuCategories, type Locale, type MenuProduct } from '~/data/menu'

const props = withDefaults(
  defineProps<{
    item: MenuProduct
    text: Record<string, any>
    locale: Locale
    index?: number
  }>(),
  {
    index: 0,
  },
)

const { add } = useCart()
const { confirmedId, open } = useCustomiser()

const justAdded = ref(false)
const addButton = ref<HTMLElement | null>(null)

let addedTimer: ReturnType<typeof setTimeout> | undefined

const ordinal = computed(() => (props.index > 0 ? String(props.index).padStart(2, '0') : ''))

// The card resolves its own category so a product only ever has to declare its id.
const category = computed(() => menuCategories.find((entry) => entry.id === props.item.categoryId))
const categoryLabel = computed(() => category.value?.name[props.locale] ?? '')

const isSoldOut = computed(() => props.item.available === false)

/**
 * The customiser lives in one shared dialog, so the card only has to acknowledge
 * the confirmation it is told about.
 */
watch(confirmedId, (id) => {
  if (id !== props.item.id) return

  justAdded.value = true

  if (addedTimer) clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    justAdded.value = false
  }, 1900)
})

onBeforeUnmount(() => {
  if (addedTimer) clearTimeout(addedTimer)
})
</script>

<template>
  <article class="card">
    <div class="card-media">
      <SkeletonImage
        :src="props.item.image"
        :alt="props.item.name[props.locale]"
        :width="1200"
        :height="800"
        :sizes="'(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 400px'"
      />
    </div>

    <div class="card-overlay">
      <span v-if="category" class="card-badge">
        <Icon :name="category.icon" class="card-badge__icon" aria-hidden="true" />
        {{ categoryLabel }}
      </span>
      <span v-if="ordinal" class="card-index">{{ ordinal }}</span>
    </div>

    <div class="card-body">
      <h3 class="card-name">{{ props.item.name[props.locale] }}</h3>
      <p class="card-note">{{ props.item.description[props.locale] }}</p>

      <div class="card-meta">
        <span class="card-price">
          <bdi class="card-price__value">{{ props.item.price }}</bdi>
          <small class="card-price__unit">{{ props.text.menu.priceLabel }}</small>
        </span>

        <span v-if="isSoldOut" class="card-status">
          {{ props.text.contact.pending }}
        </span>
      </div>

      <button
        ref="addButton"
        class="card-add"
        type="button"
        :disabled="isSoldOut"
        @click="open(props.item, addButton)"
      >
        <Icon
          :name="justAdded ? 'lucide:check' : 'lucide:shopping-bag'"
          class="card-add__icon"
          aria-hidden="true"
        />
        <span>{{ justAdded ? props.text.menu.added : props.text.menu.add }}</span>
      </button>

      <span class="visually-hidden" role="status" aria-live="polite">
        {{ justAdded ? `${props.item.name[props.locale]} — ${props.text.menu.added}` : '' }}
      </span>
    </div>
  </article>
</template>
