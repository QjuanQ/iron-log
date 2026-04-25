import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ⚠️ Cambia 'TU_USUARIO' por tu nombre de usuario de GitHub
const GITHUB_USER = 'QjuanQ'
const REPO_NAME = 'iron-log'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Iron Log',
        short_name: 'Iron Log',
        description: 'Registro de entrenamiento de fuerza',
        theme_color: '#ff8c00',
        background_color: '#080808',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `/${REPO_NAME}/`,
        icons: [
          {
            src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' rx='24' fill='%23080808'/><text y='148' font-size='140' text-anchor='middle' x='96' fill='%23ff8c00'>⬡</text></svg>",
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='64' fill='%23080808'/><text y='400' font-size='380' text-anchor='middle' x='256' fill='%23ff8c00'>⬡</text></svg>",
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ]
})
