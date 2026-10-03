/**
 * Minimal static server for verifying a generated build locally.
 *
 * `npx serve` needs a network install, and Chrome needs a real origin: the
 * generated shell references `/_nuxt/...` with absolute paths, which do not
 * resolve over file://. This is a test harness, not a production server.
 */
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('../.output/public', import.meta.url)))
const port = Number(process.argv[2] ?? 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const resolveFile = async (url) => {
  const path = normalize(decodeURIComponent(url.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let target = join(root, path)

  try {
    const info = await stat(target)
    if (info.isDirectory()) target = join(target, 'index.html')
  } catch {
    target = join(root, 'index.html')
  }

  return target
}

createServer(async (request, response) => {
  const file = await resolveFile(request.url ?? '/')

  try {
    await stat(file)
    response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(response)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' })
    response.end('not found')
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`))
