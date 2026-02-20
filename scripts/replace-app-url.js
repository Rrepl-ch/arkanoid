/**
 * Подставляет APP_URL в манифест и index.html перед сборкой для Base Mini App.
 * Запуск: APP_URL=https://your-app.vercel.app node scripts/replace-app-url.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || ''
const base = appUrl.replace(/\/$/, '')

if (!base) {
  console.error('Set APP_URL before build:base, e.g. APP_URL=https://arkanoid.vercel.app npm run build:base')
  process.exit(1)
}

const manifestPath = join(root, 'public', '.well-known', 'farcaster.json')
const indexPath = join(root, 'index.html')

let manifest = readFileSync(manifestPath, 'utf8')
manifest = manifest.replace(/https:\/\/__APP_URL__/g, base)
writeFileSync(manifestPath, manifest)

let html = readFileSync(indexPath, 'utf8')
html = html.replace(/https:\/\/__APP_URL__/g, base)
writeFileSync(indexPath, html)

console.log('Replaced __APP_URL__ with:', base)
