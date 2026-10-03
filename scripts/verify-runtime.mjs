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
  await evaluate(sessionId, `(async () => {
    const step = innerHeight * 0.6
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    }
    scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 900))
  })()`)

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
  report('cards still clipped', cards.clipped.length, (n) => n === 0)
  if (cards.clipped.length) console.log(`        ${JSON.stringify([...new Set(cards.clipped)].slice(0, 3))}`)
  report('cards with collapsed artwork', cards.zeroHeight, (n) => n === 0)

  // ---- 3. Add to cart: the bar appears and the page reserves room ---------
  const cart = await evaluate(sessionId, `(async () => {
    const card = document.querySelector('.card')
    if (!card) return { error: 'no card' }

    // The card's button opens the customiser; the confirm button commits.
    card.querySelector('.card-add').click()
    await new Promise((r) => setTimeout(r, 400))

    const confirm = card.querySelector('.card-confirm')
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

  // ---- 5. Animated surfaces ------------------------------------------------
  const motion = await evaluate(sessionId, `(() => ({
    layers: document.querySelectorAll('.brand-motion').length,
    animated: document.getAnimations().filter((a) => a.playState === 'running').length,
  }))()`)

  console.log(`  INFO  motion layers: ${motion.layers}, running animations: ${motion.animated}`)

  // ---- 6. Mega menu is driven by state, not by :hover alone -----------------
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
