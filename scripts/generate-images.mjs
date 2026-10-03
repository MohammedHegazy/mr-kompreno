/**
 * Generates responsive derivatives for product photography.
 *
 * The originals are 1200x800 JPEGs at 126-234 KB each and eleven of them ship
 * in the initial payload, because every card referenced the same full-size file
 * no matter how wide the card actually was. A phone rendered a 350px card from
 * a 1200px source.
 *
 * For each source this writes:
 *   - WebP at 480, 768 and 1200 wide (the format the page requests)
 *   - a re-encoded JPEG fallback at the same widths, for the `jpeg` <source>
 *
 * A source narrower than the ladder gets no upscaled rung, so the widths it
 * actually produced are recorded in app/generated/derivatives.json and the
 * component offers exactly those. Advertising a rung that was never written is
 * not a cosmetic mistake: the browser picks the candidate that satisfies its
 * device pixel ratio, requests it, and gets a 404, so the image does not load
 * at all on any screen dense enough to want that rung.
 *
 * Originals are left untouched: they are the source of record and the plan
 * calls for derivatives alongside them, not replacements.
 *
 * Run with `npm run images`. Output is skipped when the file already exists at
 * the right size, so it is safe to run in a loop.
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const SOURCE_DIR = join(root, 'public', 'items')
const OUTPUT_DIR = join(root, 'public', 'items', 'responsive')
const MANIFEST = join(root, 'app', 'generated', 'derivatives.json')

/** Widths a card can actually be at, so nothing is generated that is never used. */
const WIDTHS = [480, 768, 1200]

const JPEG_QUALITY = 78
const WEBP_QUALITY = 72

const sources = (await readdir(SOURCE_DIR))
  .filter((file) => /\.(jpe?g|png)$/i.test(file))
  .filter((file) => !file.includes(`${'responsive'}`))

if (!sources.length) {
  console.error('No source images found in public/items')
  process.exit(1)
}

await mkdir(OUTPUT_DIR, { recursive: true })

let written = 0
let skipped = 0

/** Source path -> the widths actually on disk for it, ascending. */
const manifest = {}

for (const file of sources) {
  const input = join(SOURCE_DIR, file)
  const stem = file.replace(/\.(jpe?g|png)$/i, '')
  const image = sharp(input)
  const { width: sourceWidth, height: sourceHeight } = await image.metadata()

  const produced = new Set()

  for (const width of WIDTHS) {
    // Never upscale. A 840px-wide portrait source cannot fill a 1200px slot, and
    // an upscaled derivative is larger and blurrier than the original.
    const target = Math.min(width, sourceWidth)
    const height = Math.round((sourceHeight / sourceWidth) * target)

    produced.add(target)

    const jobs = [
      {
        path: join(OUTPUT_DIR, `${stem}-${target}.webp`),
        pipeline: () => sharp(input)
          .resize({ width: target, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY }),
      },
      {
        path: join(OUTPUT_DIR, `${stem}-${target}.jpg`),
        pipeline: () => sharp(input)
          .resize({ width: target, withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true }),
      },
    ]

    for (const job of jobs) {
      try {
        const existing = await stat(job.path)
        if (existing.size > 0) { skipped += 1; continue }
      } catch { /* not generated yet */ }

      await job.pipeline().toFile(job.path)
      written += 1
    }
  }

  manifest[`/items/${file}`] = [...produced].sort((a, b) => a - b)

  console.log(`${file} (${sourceWidth}x${sourceHeight}) -> ${manifest[`/items/${file}`].join(', ')}`)
}

await mkdir(join(root, 'app', 'generated'), { recursive: true })
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(`\n${written} file(s) written, ${skipped} already present -> public/items/responsive`)
console.log(`${Object.keys(manifest).length} source(s) recorded -> app/generated/derivatives.json`)
