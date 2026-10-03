import type { MenuProduct } from '~/data/menu'

/**
 * The card that opened the dialog.
 *
 * Module scope, not composable scope: `useCustomiser` is called once per card
 * and once by the dialog, so a variable declared inside the function would give
 * the card and the dialog a different trigger each and focus would never come
 * back. A DOM node is not serialisable and `useState` is, so this cannot live in
 * reactive state, and it is only ever assigned from a click.
 */
let trigger: HTMLElement | null = null

/**
 * Which product the customiser is open for.
 *
 * The quantity and notes form used to live inside every card, which meant
 * twelve copies of it fighting one card's geometry: in flow it grew the card and
 * stretched its row, anchored to the card it covered the button that closes it,
 * and stretched to the frame it painted over the photograph. One shared dialog
 * removes that whole class of problem, and the card goes back to being a card.
 */
export const useCustomiser = () => {
  const item = useState<MenuProduct | null>('komp-customiser-item', () => null)

  /** Set to a product id on confirm so the card it came from can acknowledge. */
  const confirmedId = useState<string | null>('komp-customiser-confirmed', () => null)

  const open = (product: MenuProduct, from?: HTMLElement | null) => {
    trigger = from ?? null
    item.value = product
  }

  const close = () => {
    item.value = null

    const previous = trigger
    trigger = null
    previous?.focus()
  }

  const confirm = (productId: string) => {
    confirmedId.value = productId
    close()
  }

  return { item, confirmedId, open, close, confirm }
}
