import type { Locale } from '~/data/menu'

export interface CartLine {
  /** Product id plus the note, so two different notes stay separate lines. */
  key: string
  productId: string
  name: Record<Locale, string>
  price: number
  quantity: number
  note: string
}

export interface CartDraft {
  id: string
  name: Record<Locale, string>
  price: number
}

const MAX_NOTE = 140
const MAX_QUANTITY = 20

// Notes are part of the line identity: "no onion" and "extra cheese" are two
// separate orders, not two edits of one line.
const lineKey = (productId: string, note: string) =>
  note ? `${productId}::${note.toLowerCase()}` : productId

export const useCart = () => {
  const lines = useState<CartLine[]>('komp-cart', () => [])

  const add = (draft: CartDraft, quantity: number, note: string) => {
    const cleanNote = note.trim().slice(0, MAX_NOTE)
    const key = lineKey(draft.id, cleanNote)
    const existing = lines.value.find((line) => line.key === key)

    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity)
      return
    }

    lines.value = [
      ...lines.value,
      {
        key,
        productId: draft.id,
        name: draft.name,
        price: draft.price,
        quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)),
        note: cleanNote,
      },
    ]
  }

  const remove = (key: string) => {
    lines.value = lines.value.filter((line) => line.key !== key)
  }

  const setQuantity = (key: string, quantity: number) => {
    if (quantity < 1) {
      remove(key)
      return
    }

    lines.value = lines.value.map((line) =>
      line.key === key ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) } : line,
    )
  }

  const clear = () => {
    lines.value = []
  }

  const count = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0))
  const total = computed(() => lines.value.reduce((sum, line) => sum + line.price * line.quantity, 0))

  /** One WhatsApp-ready order summary, in the language the reader is browsing. */
  const buildMessage = (locale: Locale, priceLabel: string, copy: Record<string, any>) => {
    const rows = lines.value.map((line, position) => {
      const amount = line.price * line.quantity
      const note = line.note ? `\n   ${copy.cart.note}: ${line.note}` : ''
      return `${position + 1}. ${line.name[locale]} ×${line.quantity} — ${amount} ${priceLabel}${note}`
    })

    return [copy.cart.header, '', ...rows, '', `${copy.cart.total}: ${total.value} ${priceLabel}`].join('\n')
  }

  return { lines, add, remove, setQuantity, clear, count, total, buildMessage }
}
