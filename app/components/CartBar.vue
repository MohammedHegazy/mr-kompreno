<script setup lang="ts">
import { contactChannels, type Locale } from '~/data/menu'

const props = defineProps<{ text: Record<string, any>; locale: Locale }>()

const { lines, count, total, remove, setQuantity, clear, buildMessage } = useCart()

const isOpen = ref(false)

const checkoutHref = computed(() => {
  const channel = contactChannels.find((entry) => entry.key === 'whatsapp')
  if (!channel) return ''

  const message = buildMessage(props.locale, props.text.menu.priceLabel, props.text)
  return `${channel.href}?text=${encodeURIComponent(message)}`
})

const countLabel = computed(() =>
  count.value === 1 ? props.text.cart.item : props.text.cart.items,
)

// A modified click means the reader is opening the thread in another tab, so the
// basket has to survive for them.
function onCheckout(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  clear()
}
</script>

<template>
  <Transition name="cart-rise">
    <aside v-if="count > 0" class="cart-bar" role="region" :aria-label="props.text.cart.title">
      <div class="cart-bar__inner">
        <div class="cart-bar__lead">
          <span class="cart-bar__icon">
            <Icon name="lucide:shopping-bag" aria-hidden="true" />
          </span>
          <span class="cart-bar__meta">
            <strong class="cart-bar__title">{{ props.text.cart.title }}</strong>
            <bdi class="cart-bar__count">{{ count }} {{ countLabel }}</bdi>
          </span>
        </div>

        <div class="cart-bar__actions">
          <div class="cart-bar__total">
            <span class="cart-bar__total-label">{{ props.text.cart.total }}</span>
            <bdi class="cart-bar__total-value">{{ total }} {{ props.text.menu.priceLabel }}</bdi>
          </div>

          <button
            class="cart-bar__toggle"
            type="button"
            :aria-expanded="isOpen"
            @click="isOpen = !isOpen"
          >
            {{ props.text.cart.showItems }}
            <Icon
              name="lucide:chevron-down"
              class="cart-bar__toggle-icon"
              :class="{ 'is-open': isOpen }"
              aria-hidden="true"
            />
          </button>

          <button class="cart-bar__clear" type="button" @click="clear">
            {{ props.text.cart.clear }}
          </button>

          <a v-if="checkoutHref" class="cart-bar__checkout" :href="checkoutHref" @click="onCheckout">
            <Icon name="simple-icons:whatsapp" aria-hidden="true" />
            <span>{{ props.text.cart.checkout }}</span>
          </a>
        </div>
      </div>

      <div class="cart-lines" :class="{ 'is-open': isOpen }">
        <div class="cart-lines__inner">
          <ul class="cart-lines__list">
            <li v-for="line in lines" :key="line.key" class="cart-line">
              <span class="cart-line__name">{{ line.name[props.locale] }}</span>
              <span v-if="line.note" class="cart-line__note">
                {{ props.text.cart.note }}: {{ line.note }}
              </span>

              <div class="cart-line__qty">
                <button
                  type="button"
                  :aria-label="props.text.menu.decrease"
                  @click="setQuantity(line.key, line.quantity - 1)"
                >
                  <Icon name="lucide:minus" aria-hidden="true" />
                </button>
                <bdi>{{ line.quantity }}</bdi>
                <button
                  type="button"
                  :aria-label="props.text.menu.increase"
                  @click="setQuantity(line.key, line.quantity + 1)"
                >
                  <Icon name="lucide:plus" aria-hidden="true" />
                </button>
              </div>

              <bdi class="cart-line__price">{{ line.price * line.quantity }}</bdi>

              <button
                class="cart-line__remove"
                type="button"
                :aria-label="props.text.cart.clear"
                @click="remove(line.key)"
              >
                <Icon name="lucide:x" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  </Transition>
</template>
