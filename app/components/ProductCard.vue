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

const isCustomising = ref(false)
const quantity = ref(1)
const note = ref('')
const justAdded = ref(false)

let addedTimer: ReturnType<typeof setTimeout> | undefined

const panelId = `product-panel-${props.item.id}`
const noteId = `product-note-${props.item.id}`

const ordinal = computed(() => (props.index > 0 ? String(props.index).padStart(2, '0') : ''))

// The card resolves its own category so a product only ever has to declare its id.
const category = computed(() => menuCategories.find((entry) => entry.id === props.item.categoryId))
const categoryLabel = computed(() => category.value?.name[props.locale] ?? '')

const isSoldOut = computed(() => props.item.available === false)

function changeQuantity(delta: number) {
  quantity.value = Math.min(20, Math.max(1, quantity.value + delta))
}

function openCustomiser() {
  isCustomising.value = true
}

function confirmAdd() {
  add(props.item, quantity.value, note.value)

  quantity.value = 1
  note.value = ''
  isCustomising.value = false
  justAdded.value = true

  if (addedTimer) clearTimeout(addedTimer)
  addedTimer = setTimeout(() => {
    justAdded.value = false
  }, 1900)
}

onBeforeUnmount(() => {
  if (addedTimer) clearTimeout(addedTimer)
})
</script>

<template>
  <article class="card" :class="{ 'is-open': isCustomising }">
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

        <span v-if="isSoldOut" class="card-status">
          {{ props.text.contact.pending }}
        </span>
      </div>

      <button
        class="card-add"
        type="button"
        :disabled="isSoldOut"
        :aria-expanded="isCustomising"
        :aria-controls="panelId"
        @click="openCustomiser"
      >
        <Icon
          :name="justAdded ? 'lucide:check' : 'lucide:shopping-bag'"
          class="card-add__icon"
          aria-hidden="true"
        />
        <span>{{ justAdded ? props.text.menu.added : props.text.menu.add }}</span>
      </button>

      <div :id="panelId" class="card-panel">
        <div class="card-panel__inner">
          <div class="card-panel__row">
            <span class="card-panel__label">{{ props.text.menu.quantity }}</span>

            <div class="card-stepper">
              <button
                type="button"
                class="card-stepper__btn"
                :disabled="quantity <= 1"
                :aria-label="props.text.menu.decrease"
                @click="changeQuantity(-1)"
              >
                <Icon name="lucide:minus" aria-hidden="true" />
              </button>
              <bdi class="card-stepper__value">{{ quantity }}</bdi>
              <button
                type="button"
                class="card-stepper__btn"
                :disabled="quantity >= 20"
                :aria-label="props.text.menu.increase"
                @click="changeQuantity(1)"
              >
                <Icon name="lucide:plus" aria-hidden="true" />
              </button>
            </div>
          </div>

          <label class="card-panel__label" :for="noteId">{{ props.text.menu.notes }}</label>
          <textarea
            :id="noteId"
            v-model="note"
            class="card-notes"
            rows="2"
            maxlength="140"
            :placeholder="props.text.menu.notesHint"
          />

          <button class="card-confirm" type="button" @click="confirmAdd">
            {{ props.text.menu.confirm }}
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
