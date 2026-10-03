<script setup lang="ts">
import type { Locale } from '~/data/menu'

const props = defineProps<{
  text: Record<string, any>
  locale: Locale
}>()

const { item, close, confirm } = useCustomiser()
const { add } = useCart()

const quantity = ref(1)
const note = ref('')
const panel = ref<HTMLElement | null>(null)

function changeQuantity(delta: number) {
  quantity.value = Math.min(20, Math.max(1, quantity.value + delta))
}

function confirmAdd() {
  if (!item.value) return

  add(item.value, quantity.value, note.value)
  confirm(item.value.id)

  quantity.value = 1
  note.value = ''
}

// A fresh dialog must never open showing the last item's draft. The panel is
// created by the transition on this tick, so focus can only be taken after the
// DOM exists.
watch(item, async (next) => {
  document.removeEventListener('keydown', onDocumentKeydown)

  if (!next) return

  document.addEventListener('keydown', onDocumentKeydown)

  quantity.value = 1
  note.value = ''
  await nextTick()
  panel.value?.focus()
})

// Escape is handled on the document rather than the panel. A modal that has
// focus sits in the page's tab order, but a click on the backdrop or a browser
// find bar can move focus out of it, and a dialog the reader cannot leave with
// the key they expect is a trap rather than a dialog.
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !panel.value) return

  const focusable = panel.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), textarea:not([disabled])',
  )

  if (!focusable.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first?.focus()
  }
}
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <Transition name="customiser">
    <div v-if="item" class="customiser-overlay" @click.self="close">
      <div
        ref="panel"
        class="customiser-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customiser-title"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div class="customiser-top">
          <SkeletonImage
            class="customiser-thumb"
            :src="item.image"
            :alt="item.name[props.locale]"
            :width="160"
            :height="120"
            sizes="80px"
          />

          <h2 id="customiser-title" class="customiser-title">{{ item.name[props.locale] }}</h2>

          <button
            class="customiser-close"
            type="button"
            :aria-label="props.text.menu.cancel"
            @click="close"
          >
            <Icon name="lucide:x" aria-hidden="true" />
          </button>
        </div>

        <div class="customiser-row">
          <span class="customiser-label">{{ props.text.menu.quantity }}</span>

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

        <label class="customiser-label" for="customiser-note">{{ props.text.menu.notes }}</label>
        <textarea
          id="customiser-note"
          v-model="note"
          class="card-notes"
          rows="3"
          maxlength="140"
          :placeholder="props.text.menu.notesHint"
        />

        <button class="card-confirm" type="button" @click="confirmAdd">
          {{ props.text.menu.confirm }}
        </button>
      </div>
    </div>
  </Transition>
</template>
