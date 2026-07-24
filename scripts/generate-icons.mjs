// Erzeugt die PNG-App-Icons aus public/icons/favicon.svg.
// Aufruf: npm run icons  (benoetigt die devDependency "sharp").
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const svg = readFileSync(join(dir, 'favicon.svg'))

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }, // iOS Home-Bildschirm
]

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(join(dir, t.name))
  console.log('erzeugt:', t.name, `${t.size}x${t.size}`)
}
