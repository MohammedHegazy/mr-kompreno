<script setup lang="ts">
import { contactChannels, menuCategories, type Locale, type MenuProduct } from '~/data/menu'

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

const isOpen = ref(false)
const detailId = `product-detail-${props.item.id}`

const ordinal = computed(() => (props.index > 0 ? String(props.index).padStart(2, '0') : ''))

// The card resolves its own category so a product only ever has to declare its id.
const category = computed(() => menuCategories.find((entry) => entry.id === props.item.categoryId))
const categoryLabel = computed(() => category.value?.name[props.locale] ?? '')

// One tap takes the reader into a WhatsApp thread that already names the dish,
// so ordering never requires retyping what they just chose.
const orderHref = computed(() => {
  const whatsapp = contactChannels.find((channel) => channel.key === 'whatsapp')
  if (!whatsapp) return ''

  const message =
    props.locale === 'ar'
      ? `مرحبًا MR.KOMPRENO، أود طلب: ${props.item.name.ar}`
      : `Hello MR.KOMPRENO, I would like to order: ${props.item.name.en}`

  return `${whatsapp.href}?text=${encodeURIComponent(message)}`
})
</script>

<template>
  <article class="card" :class="{ 'is-open': isOpen }">
    <div class="card-media">
      <SkeletonImage :src="props.item.image" :alt="props.item.name[props.locale]" />
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

        <span v-if="props.item.available === false" class="card-status">
          {{ props.text.contact.pending }}
        </span>
      </div>

      <button
        class="card-toggle"
        type="button"
        :aria-expanded="isOpen"
        :aria-controls="detailId"
        @click="isOpen = !isOpen"
      >
        <span>{{ props.text.menu.cta }}</span>
        <Icon name="lucide:chevron-down" class="card-toggle__icon" aria-hidden="true" />
      </button>

      <div :id="detailId" class="card-detail">
        <div class="card-detail__inner">
          <a v-if="orderHref" class="card-order" :href="orderHref" target="_blank" rel="noopener">
            <Icon name="simple-icons:whatsapp" class="card-order__icon" aria-hidden="true" />
            {{ props.text.menu.order }}
          </a>
        </div>
      </div>
    </div>
  </article>
</template>
