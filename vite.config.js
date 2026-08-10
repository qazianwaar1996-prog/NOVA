import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['.e2b.app', 'localhost', '.local'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'JARVIS — AI Operations Command Center',
        short_name: 'JARVIS',
        description: 'AI Operations Command Center — Master AI Orchestrator',
        theme_color: '#FF8C00',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/NOVA/',
        scope: '/NOVA/',
        icons: [
          { src: '/NOVA/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/NOVA/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: '/NOVA/index.html',
        navigateFallbackDenylist: [/^\/NOVA\/assets\//]
      }
    })
  ],
  base: '/NOVA/',
})
