/**
 * Regression guard for the add-to-cart defect.
 *
 * The bug was a product card whose photograph stayed clipped to zero height
 * because an IntersectionObserver callback never arrived. Nothing about that
 * failure is visible in a build log, so it is asserted structurally here:
 *
 *   1. Every card root must be marked for reveal, since the card's clip is
 *      driven by `.is-inview` on that root. A card without v-reveal has nothing
 *      to ever add that class.
 *   2. The backstop must exist, so a missed callback still resolves.
 *   3. Clipped surfaces must have a rule that opens them without a transition,
 *      since the default clipped state is "no content".
 *   4. The clip must not be media-gated, because the defect is viewport
 *      independent.
 *
 * Run with `npm run check:motion`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const failures = []

const read = (relative) => readFileSync(join(root, relative), 'utf8')

/** Comments explain these decisions, and would otherwise trip the guards below. */
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const card = stripComments(read('app/components/ProductCard.vue'))
const reveal = stripComments(read('app/plugins/reveal.ts'))
const css = stripComments(read('app/assets/css/main.css'))

// 1. v-reveal is applied where ProductCard is used, and lands on its single
//    root element. A fragment root would put the class somewhere else and the
//    clip would never open.
if (!/<article[^>]*class="card"/s.test(card)) {
  failures.push('ProductCard.vue: no .card root element.')
}

if (/\bpath\b|<template[^>]*>\s*<template/.test(card)) {
  failures.push('ProductCard.vue: the root is not a single element, so v-reveal cannot bind .is-inview to it.')
}

const cardUsages = readdirSync(join(root, 'app/pages'))
  .filter((file) => file.endsWith('.vue'))
  .some((file) => /<ProductCard[\s\S]{0,400}?v-reveal/.test(stripComments(read(join('app/pages', file)))))

if (!cardUsages) {
  failures.push('No page applies v-reveal to <ProductCard>. The cards would be mounted already-clipped.')
}

// 2. A per-element deadline exists, not just a document-wide one.
if (!/ELEMENT_BACKSTOP/.test(reveal) || !/setTimeout/.test(reveal)) {
  failures.push('reveal.ts: no per-element backstop. A missed IntersectionObserver callback strands content forever.')
}

if (!/is-inview[\s\S]{0,200}return/.test(reveal) && !/data-reveal-stranded/.test(reveal)) {
  failures.push('reveal.ts: the backstop does not mark the stranded state the stylesheet keys on.')
}

// 3. Clipped surfaces open without a transition.
if (!/\.card\[data-reveal-stranded\] \.card-media/.test(css)) {
  failures.push('main.css: no fail-open rule for a stranded .card-media.')
}

if (!/data-reveal-stranded[\s\S]{0,400}transition:\s*none/.test(css)) {
  failures.push('main.css: the stranded rule animates. It must resolve with transition: none.')
}

// 4. The clip is not scoped to a viewport, and reduced motion does not mask it.
const clipRule = css.match(/html\.reveal-ready \.card-media\s*\{[\s\S]*?\}/)

if (!clipRule) {
  failures.push('main.css: the .card-media clip rule is missing.')
} else if (/@media/.test(clipRule[0])) {
  failures.push('main.css: the .card-media clip is inside a media query. The defect is viewport independent.')
}

if (!/prefers-reduced-motion/.test(reveal)) {
  failures.push('reveal.ts: reduced-motion short-circuit removed. It was masking the stranded-clip bug.')
}

// House rules the performance work depends on.
if (/backdrop-filter/.test(read('app/components/CartBar.vue'))) {
  failures.push('CartBar.vue: backdrop-filter returned on a fixed element.')
}

const productCards = readdirSync(join(root, 'app/components'))
  .filter((file) => file.endsWith('.vue'))
  .filter((file) => /BrandMotionBackground/.test(read(join('app/components', file))))

const allowed = ['BrandHero.vue', 'BrandMotionBackground.vue']

const unexpected = productCards.filter((file) => !allowed.includes(file))

if (unexpected.length) {
  failures.push(`Animated motion layer mounted outside the hero: ${unexpected.join(', ')}. Each instance is a permanently animating full-bleed surface.`)
}

if (/:has\(/.test(css)) {
  failures.push('main.css: a :has() selector returned. On <body> it invalidates layout on every DOM mutation.')
}

for (const failure of failures) console.error(`FAIL  ${failure}`)

if (failures.length) {
  console.error(`\n${failures.length} guard(s) failed.`)
  process.exit(1)
}

console.log('motion guard: all checks passed')
