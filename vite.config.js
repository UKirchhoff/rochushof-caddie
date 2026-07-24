import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages Projektseite: https://ukirchhoff.github.io/rochushof-caddie/
// -> base muss der Repo-Name mit fuehrendem/abschliessendem Slash sein.
const base = '/rochushof-caddie/'

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Vollstaendige Offline-Faehigkeit: alle Build-Assets werden vorab gecacht.
      // Workbox buendelt zur Build-Zeit -> keine Runtime-Abhaengigkeit / kein CDN.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: base,
      },
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: false, // eigenes public/manifest.json wird verwendet
    }),
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
})
