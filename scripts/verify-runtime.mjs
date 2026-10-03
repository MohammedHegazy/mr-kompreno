/**
 * Runtime verification of the add-to-cart defect, driven through the Chrome
 * DevTools Protocol.
 *
 * The defect was a clipped photograph with no visible cause, so it cannot be
 * confirmed from a build log or a DOM dump. It needs a real scroll, a real
 * click, and a computed style read on the artwork at both viewports.
 *
 * Usage: node scripts/verify-runtime.mjs [url]
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const URL_UNDER_TEST = process.argv[2] ?? 'http://localhost:4173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, dsf: 2 },
  { name: 'tablet', width: 820, height: 1180, dsf: 2 },
  { name: 'desktop', width: 1920, height: 1080, dsf: 1 },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const profile = mkdtempSync(join(tmpdir(), 'kompreno-cdp-'))
const port = 9333

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' })

const cleanup = () => {
  chrome.kill()
  // Chrome flushes its profile asynchronously, so removal is best-effort.
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch { /* left in TEMP */ }
}
process.on('exit', cleanup)

let socket
let nextId = 0
const pendingCalls = new Map()

const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId
  pendingCalls.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params, sessionId }))
})

const evaluate = async (sessionId, expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }, sessionId)

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? 'evaluation failed')
  }

  return result.result.value
}

/** A real key press through the input pipeline, not a synthetic page event. */
const pressKey = async (sessionId, key, code) => {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key,
      code,
      windowsVirtualKeyCode: key === 'Escape' ? 27 : 0,
      nativeVirtualKeyCode: key === 'Escape' ? 27 : 0,
    }, sessionId)
  }
}

const pressEscape = (sessionId) => pressKey(sessionId, 'Escape', 'Escape')

const connect = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://localhost:${port}/json/version`)
      const info = await response.json()
      if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl
    } catch { /* not up yet */ }
    await sleep(250)
  }

  throw new Error('Chrome did not expose a debugging endpoint')
}

const endpoint = await connect()

socket = new WebSocket(endpoint)

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  const call = pendingCalls.get(message.id)
  if (!call) return
  pendingCalls.delete(message.id)
  if (message.error) call.reject(new Error(message.error.message))
  else call.resolve(message.result)
})

const failures = []
let scope = ''
const report = (label, actual, expected) => {
  const ok = expected(actual)
  if (!ok) failures.push(`${scope}: ${label} -> ${JSON.stringify(actual)}`)
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(actual)}`)
}

/**
 * The observer is removed before any page script runs, so not one callback ever
 * arrives. This is the reported defect reproduced exactly: every card mounts in
 * its clipped state and nothing tells it otherwise. With the geometry sweep in
 * place the page must still be completely readable.
 *
 * This is the check that would have caught the original bug, and the reason the
 * clip is no longer allowed to depend on a callback at all.
 */
const KILL_OBSERVER = `
  window.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  window.__komprenoObserverKilled = true
`

/**
 * Injected into the page. `inset(0px)` and `inset(0px 0px 0px 0px)` are both
 * fully open; `inset(0px 0px 100% 0px)` is the defect. Comparing the raw
 * string against a list of "open" spellings gets this wrong in both
 * directions, so the inset values are parsed instead.
 */
const CLIP_PROBE = `
  window.__komprenoClip = (element) => {
    const clip = getComputedStyle(element).clipPath
    if (!clip || clip === 'none') return null

    const inset = clip.match(/^inset\\(([^)]*)\\)$/)
    if (!inset) return clip

    const parts = inset[1].trim().split(/\\s+/).map((value) => parseFloat(value) || 0)
    const [top, right = 0, bottom = 0, left = 0] = parts
    if (parts.length === 2) return top === 0 && right === 0 ? null : clip

    return top === 0 && right === 0 && bottom === 0 && left === 0 ? null : clip
  }
`

const runViewport = async (viewport, { killObserver }) => {
  scope = killObserver ? `${viewport.name} (observer disabled)` : viewport.name

  console.log(`\n${viewport.name} ${viewport.width}x${viewport.height} @${viewport.dsf}x`)


  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)

  // A silent exception inside arm() would leave the plugin half-initialised:
  // elements observed and revealed, but never settled. Collect them.
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__komprenoErrors = []
      addEventListener('error', (e) => window.__komprenoErrors.push(String(e.message)))
      addEventListener('unhandledrejection', (e) => window.__komprenoErrors.push('rejection: ' + String(e.reason)))
      ${killObserver ? KILL_OBSERVER : ''}
    `,
  }, sessionId)

  await send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.dsf,
    mobile: viewport.name === 'mobile',
  }, sessionId)

  await send('Page.navigate', { url: URL_UNDER_TEST }, sessionId)
  await sleep(3500)

  // Dismiss the brand loader if it is still up, the way a returning visitor's
  // session would.
  await evaluate(sessionId, `sessionStorage.setItem('kompreno.loader.seen','1')`)
  await send('Page.reload', {}, sessionId)
  await sleep(3500)

  await evaluate(sessionId, CLIP_PROBE)

  const observerAlive = await evaluate(sessionId, `typeof IntersectionObserver.prototype.observe === 'function' && !window.__komprenoObserverKilled`)
  if (killObserver) {
    report('observer really is disabled', observerAlive, (v) => v === false)
  }

  // ---- 1. Nothing on the first screen may be left clipped -----------------
  const aboveFold = await evaluate(sessionId, `(() => {
    const clipped = []
    for (const media of document.querySelectorAll('.card-media, [data-reveal="curtain"]')) {
      const rect = media.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= innerHeight) continue
      const clip = window.__komprenoClip(media)
      if (clip) clipped.push({ clip, top: Math.round(rect.top) })
    }
    return clipped
  })()`)

  report('above-fold clipped surfaces', aboveFold.length, (n) => n === 0)
  if (aboveFold.length) console.log(`        ${JSON.stringify(aboveFold.slice(0, 3))}`)

  // ---- 2. Scroll the whole page; every card must open ---------------------
  // Stepped, like a reader, then polled. With IntersectionObserver disabled the
  // scroll sweep is the only thing that can open a card, and it is batched into
  // an animation frame, so a single fixed sleep races it. Polling measures what
  // the reader actually gets; a card that never opens still fails.
  const settle = await evaluate(sessionId, `(async () => {
    const clipped = () => [...document.querySelectorAll('.card-media')]
      .filter((m) => window.__komprenoClip(m)).length

    const step = innerHeight * 0.6
    const started = performance.now()

    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    }
    scrollTo(0, document.body.scrollHeight)

    while (clipped() > 0 && performance.now() - started < 6000) {
      await new Promise((r) => setTimeout(r, 100))
    }

    return { remaining: clipped(), ms: Math.round(performance.now() - started) }
  })()`)

  console.log(`  INFO  every card opened in ${settle.ms}ms, ${settle.remaining} still clipped`)

  const cards = await evaluate(sessionId, `(() => {
    const all = [...document.querySelectorAll('.card')]
    return {
      total: all.length,
      inview: all.filter((c) => c.classList.contains('is-inview')).length,
      clipped: all.filter((c) => {
        const media = c.querySelector('.card-media')
        return media && window.__komprenoClip(media)
      }).map((c) => window.__komprenoClip(c.querySelector('.card-media'))),
      zeroHeight: all.filter((c) => {
        const media = c.querySelector('.card-media')
        return media && media.getBoundingClientRect().height < 20
      }).length,
    }
  })()`)


  report('cards revealed after scroll', cards.inview, (n) => n === cards.total && n > 0)

  if (cards.clipped.length) {
    const stuck = await evaluate(sessionId, `[...document.querySelectorAll('.card')]
      .filter((c) => window.__komprenoClip(c.querySelector('.card-media')))
      .map((c) => {
        const media = c.querySelector('.card-media')
        const r = media.getBoundingClientRect()
        return {
          item: c.querySelector('.card-name').textContent.trim(),
          rect: [Math.round(r.top), Math.round(r.bottom)],
          inview: c.classList.contains('is-inview'),
          stranded: media.hasAttribute('data-reveal-stranded'),
          revealing: media.classList.contains('is-revealing'),
          clip: window.__komprenoClip(media),
        }
      })`)
    console.log(`        stuck: ${JSON.stringify(stuck)}`)
  }

  report('cards still clipped', cards.clipped.length, (n) => n === 0)
  if (cards.clipped.length) console.log(`        ${JSON.stringify([...new Set(cards.clipped)].slice(0, 3))}`)
  report('cards with collapsed artwork', cards.zeroHeight, (n) => n === 0)

  // ---- 3. Add to cart: the bar appears and the page reserves room ---------
  const cart = await evaluate(sessionId, `(async () => {
    const card = document.querySelector('.card')
    if (!card) return { error: 'no card' }

    // The card's button opens the customiser dialog; its confirm button commits.
    card.querySelector('.card-add').click()
    await new Promise((r) => setTimeout(r, 400))

    const confirm = document.querySelector('.customiser-panel .card-confirm')
    if (!confirm) return { error: 'customiser did not open' }

    const before = document.body.classList.contains('has-cart')
    confirm.click()
    await new Promise((r) => setTimeout(r, 800))

    return {
      bodyHadClassBefore: before,
      bodyHasClass: document.body.classList.contains('has-cart'),
      barRendered: Boolean(document.querySelector('.cart-bar')),
      bodyPadding: getComputedStyle(document.body).paddingBottom,
      strandedCards: document.querySelectorAll('.card[data-reveal-stranded]').length,
      clippedNow: [...document.querySelectorAll('.card')].filter((c) => {
        const media = c.querySelector('.card-media')
        return media && window.__komprenoClip(media)
      }).length,
    }
  })()`)

  if (cart.error) console.log(`  ERROR ${cart.error}`)

  report('add to cart sets body.has-cart', cart.bodyHasClass, (v) => v === true)
  report('add to cart renders the bar', cart.barRendered, (v) => v === true)
  report('page reserves room for the bar', cart.bodyPadding, (v) => v !== '0px')
  report('no card clipped by the cart interaction', cart.clippedNow, (v) => v === 0)

  // ---- 4. Category swap remounts cards; they must still open --------------
  const swap = await evaluate(sessionId, `(async () => {
    const chips = [...document.querySelectorAll('.category-button')]
    const chip = chips.find((b) => !b.classList.contains('active'))
    if (!chip) return { error: 'no category chip' }

    chip.click()
    await new Promise((r) => setTimeout(r, 1600))
    scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 900))

    const all = [...document.querySelectorAll('.card')]
    return {
      total: all.length,
      clipped: all.filter((c) => {
        const media = c.querySelector('.card-media')
        return media && window.__komprenoClip(media)
      }).length,
      stranded: document.querySelectorAll('.card[data-reveal-stranded]').length,
      instantAfterSwap: document.querySelectorAll('.card[data-reveal-instant]').length,
      cardsAfterSwap: document.querySelectorAll('.card').length,
      detail: [...document.querySelectorAll('.card[data-reveal-stranded]')].map((c) => ({
        name: c.querySelector('.card-name')?.textContent?.trim().slice(0, 22),
        instant: c.hasAttribute('data-reveal-instant'),
        revealing: c.classList.contains('is-revealing'),
        top: Math.round(c.getBoundingClientRect().top),
      })),
    }
  })()`)

  if (swap.error) console.log(`  ERROR ${swap.error}`)
  const pageErrors = await evaluate(sessionId, `window.__komprenoErrors || []`)
  if (pageErrors.length) console.log(`  ERROR page errors: ${JSON.stringify(pageErrors.slice(0, 5))}`)
  console.log(`  INFO  after swap: ${swap.cardsAfterSwap} cards, ${swap.instantAfterSwap} mounted settled, ${swap.stranded} opened by the backstop`)

  // Clipping is the defect. Being opened by the backstop is the fix working,
  // and is expected on a remount that races the observer, so it is reported
  // rather than asserted.
  report('cards clipped after a category swap', swap.clipped, (v) => v === 0)
  if (swap.stranded) console.log(`        ${JSON.stringify(swap.detail)}`)

  // ---- 5. Board uniformity: images and cards must all match ---------------
  const board = await evaluate(sessionId, `(() => {
    const cards = [...document.querySelectorAll('.card')]

    const media = cards.map((c) => {
      const m = c.querySelector('.card-media')
      const r = m.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height) }
    })

    const bodies = cards.map((c) => Math.round(c.getBoundingClientRect().height))
    const uniq = (values) => [...new Set(values)]

    return {
      cards: cards.length,
      mediaSizes: uniq(media.map((m) => m.w + 'x' + m.h)),
      mediaWidths: uniq(media.map((m) => m.w)),
      mediaHeights: uniq(media.map((m) => m.h)),
      cardHeights: uniq(bodies),
      portraitClasses: document.querySelectorAll('.card-media.is-portrait').length,
    }
  })()`)

  report('every card image is the same size', board.mediaSizes.length, (n) => n === 1)
  report('card image widths match', board.mediaWidths.length, (n) => n === 1)
  report('card image heights match', board.mediaHeights.length, (n) => n === 1)
  report('every card is the same height', board.cardHeights.length, (n) => n === 1)
  report('no per-asset image ratio in use', board.portraitClasses, (n) => n === 0)

  // Geometry is not visibility. An overlay the same size as the frame still
  // measures perfectly while hiding the photograph behind it, which is exactly
  // what an opaque customiser panel did. Hit-test the middle of each image and
  // require the image itself to be what the reader's cursor would reach.
  const painted = await evaluate(sessionId, `(() => {
    const covered = []

    for (const media of document.querySelectorAll('.card-media')) {
      const r = media.getBoundingClientRect()
      if (r.bottom <= 0 || r.top >= innerHeight) continue

      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      const img = media.querySelector('img')
      const ok = img && (hit === img || img.contains(hit) || media.contains(hit))

      if (!ok) covered.push({ hit: hit ? hit.className || hit.tagName : null })
    }

    return covered
  })()`)

  report('every visible card image is actually painted', painted.length, (n) => n === 0)
  if (painted.length) console.log(`        covered by: ${JSON.stringify(painted.slice(0, 3))}`)

  console.log(`  INFO  ${board.cards} cards, images ${JSON.stringify(board.mediaSizes)}, card heights ${JSON.stringify(board.cardHeights)}`)

  if (board.mediaSizes.length > 1 || board.cardHeights.length > 1) {
    const grids = await evaluate(sessionId, `[...document.querySelectorAll('.featured-grid, .product-grid')].map((g) => ({
      cls: g.className,
      width: Math.round(g.getBoundingClientRect().width),
      cards: g.querySelectorAll('.card').length,
      columns: getComputedStyle(g).gridTemplateColumns,
      parent: g.parentElement.className,
      parentPad: getComputedStyle(g.parentElement).padding,
    }))`)
    console.log(`        grids: ${JSON.stringify(grids)}`)

    const parts = await evaluate(sessionId, `[...document.querySelectorAll('.card')].map((c) => {
      const body = c.querySelector('.card-body')
      return {
        grid: c.parentElement.className,
        name: Math.round(c.querySelector('.card-name').getBoundingClientRect().height),
        note: Math.round(c.querySelector('.card-note').getBoundingClientRect().height),
        body: Math.round(body.getBoundingClientRect().height),
      }
    })`)
    console.log(`        parts: ${JSON.stringify(parts.slice(0, 8))}`)
  }

  // The customiser is a dialog: it must not move a single card.
  const beforeOpen = await evaluate(sessionId, `(async () => {
    document.querySelectorAll('.card')[1].scrollIntoView({ block: 'center' })
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return [...document.querySelectorAll('.card')].map((c) => Math.round(c.getBoundingClientRect().height))
  })()`)

  await evaluate(sessionId, `document.querySelectorAll('.card')[1].querySelector('.card-add').click()`)
  await sleep(500)

  const dialog = await evaluate(sessionId, `(() => {
    const panels = document.querySelectorAll('.customiser-panel')

    if (panels.length !== 1) return { count: panels.length }

    const panel = panels[0]
    const r = panel.getBoundingClientRect()
    const role = panel.getAttribute('role')
    const modal = panel.getAttribute('aria-modal')

    const focusInside = panel.contains(document.activeElement)

    const label = document.getElementById(panel.getAttribute('aria-labelledby'))
    const name = label?.textContent?.trim() ?? ''
    const cardName = document.querySelectorAll('.card')[1].querySelector('.card-name').textContent.trim()

    const thumb = panel.querySelector('.customiser-thumb')
    const thumbBox = thumb?.getBoundingClientRect()

    const close = panel.querySelector('.customiser-close')
    const closeIcon = close?.querySelector('svg')
    const closeColor = getComputedStyle(closeIcon).stroke
    const closeInk = getComputedStyle(close).color
    const closeDebug = { html: close?.innerHTML?.slice(0, 160) }

    return {
      count: panels.length,
      role,
      modal,
      focusInside,
      labelled: !!panel.getAttribute('aria-labelledby'),
      name,
      nameMatches: name === cardName,
      closeColor,
      closeInk,
      closeDebug,
      thumbWidth: Math.round(thumbBox?.width ?? 0),
      thumbHeight: Math.round(thumbBox?.height ?? 0),
      thumbFits: (thumbBox?.width ?? 0) <= 80 && (thumbBox?.height ?? 0) <= 60 && (thumbBox?.width ?? 0) > 0,
      onScreen: r.top >= 0 && r.bottom <= innerHeight,
      quantity: panel.querySelector('.card-stepper__value')?.textContent?.trim(),
      hasNotes: !!panel.querySelector('textarea'),
      hasConfirm: !!panel.querySelector('.card-confirm'),
    }
  })()`)

  report('exactly one customiser dialog exists', dialog.count, (n) => n === 1)
  report('the customiser is a modal dialog', dialog.role, (v) => v === 'dialog')
  report('the customiser declares aria-modal', dialog.modal, (v) => v === 'true')
  report('the customiser is labelled by its title', dialog.labelled, (v) => v === true)
  // Labelled by the dish alone. Pointing aria-labelledby at the panel itself
  // makes the accessible name every word in the dialog, labels included.
  report('the customiser is named after the dish only', dialog.nameMatches, (v) => v === true)
  report('the customiser takes focus', dialog.focusInside, (v) => v === true)
  report('the customiser fits the viewport', dialog.onScreen, (v) => v === true)
  report('the customiser thumbnail is not stretched', dialog.thumbFits, (v) => v === true)
  report('the close icon is the brand yellow', dialog.closeColor, (v) => v === 'rgb(245, 211, 58)')
  console.log(`        close debug: ${JSON.stringify({ ink: dialog.closeInk, stroke: dialog.closeColor, html: dialog.closeDebug })}`)
  report('the customiser opens with quantity 1', dialog.quantity, (v) => v === '1')
  report('the customiser has a notes field', dialog.hasNotes, (v) => v === true)
  report('the customiser has a confirm button', dialog.hasConfirm, (v) => v === true)
  console.log(`        accessible name: ${JSON.stringify(dialog.name)}, thumb ${dialog.thumbWidth}x${dialog.thumbHeight}`)

  // No stray panel left behind in the card markup.
  const strays = await evaluate(sessionId, `document.querySelectorAll('.card .card-panel, .card-panel').length`)
  report('no panel left inside any card', strays, (n) => n === 0)

  // Escape must dismiss it and hand focus back to the card that opened it.
  await pressEscape(sessionId)
  await sleep(500)

  const dismissed = await evaluate(sessionId, `(() => ({
    open: document.querySelectorAll('.customiser-panel').length,
    focusOnTrigger: document.activeElement?.classList.contains('card-add'),
  }))()`)

  report('Escape closes the customiser', dismissed.open, (n) => n === 0)
  report('focus returns to the card button', dismissed.focusOnTrigger, (v) => v === true)

  const afterOpen = await evaluate(sessionId, `[...document.querySelectorAll('.card')].map((c) => Math.round(c.getBoundingClientRect().height))`)

  const resized = beforeOpen
    .map((height, index) => ({ index, before: height, after: afterOpen[index] }))
    .filter((entry) => entry.before !== entry.after)

  report('opening the customiser moves no card', resized.length, (n) => n === 0)
  if (resized.length) console.log(`        ${JSON.stringify(resized.slice(0, 4))}`)

  // ---- 6. Animated surfaces ------------------------------------------------
  const motion = await evaluate(sessionId, `(() => ({
    layers: document.querySelectorAll('.brand-motion').length,
    animated: document.getAnimations().filter((a) => a.playState === 'running').length,
  }))()`)

  console.log(`  INFO  motion layers: ${motion.layers}, running animations: ${motion.animated}`)

  // ---- 7. Mega menu is driven by state, not by :hover alone -----------------
  if (viewport.name === 'desktop') {
    const menu = await evaluate(sessionId, `(async () => {
      const trigger = [...document.querySelectorAll('.nav-link')]
        .find((a) => a.getAttribute('aria-controls') === 'nav-menu-panel')
      if (!trigger) return { error: 'no trigger' }

      const panel = document.getElementById('nav-menu-panel')
      const read = () => ({
        open: panel?.classList.contains('is-open') ?? null,
        expanded: trigger.getAttribute('aria-expanded'),
      })

      const initial = read()

      trigger.dispatchEvent(new MouseEvent('mouseenter'))
      await new Promise((r) => setTimeout(r, 400))
      const onEnter = read()

      dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await new Promise((r) => setTimeout(r, 400))
      const onEscape = read()

      return { initial, onEnter, onEscape }
    })()`)

    if (menu.error) {
      console.log(`  ERROR ${menu.error}`)
    } else {
      report('mega menu closed on load', menu.initial.open, (v) => v === false)
      report('mega menu opens on hover', menu.onEnter.open, (v) => v === true)
      report('aria-expanded follows the panel', menu.onEnter.expanded, (v) => v === 'true')
      report('Escape closes the mega menu', menu.onEscape.open, (v) => v === false)
      report('aria-expanded follows Escape', menu.onEscape.expanded, (v) => v === 'false')
    }
  }

  const pageErrorsFinal = await evaluate(sessionId, `window.__komprenoErrors || []`)
  report('uncaught page errors', pageErrorsFinal.length, (n) => n === 0)

  await send('Target.closeTarget', { targetId })
}

for (const viewport of VIEWPORTS) {
  await runViewport(viewport, { killObserver: false })
  await runViewport(viewport, { killObserver: true })
}

console.log('')

if (failures.length) {
  console.error(`${failures.length} runtime check(s) failed:`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('runtime verification: all checks passed')

socket.close()
cleanup()
process.exit(0)
