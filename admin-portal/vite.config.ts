import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.svg'],
      manifest: {
        name: 'EHS Next Admin',
        short_name: 'EHS Admin',
        description: 'Manage. Monitor. Serve. — Admin portal for EHS Next.',
        theme_color: '#0B0C0E',
        background_color: '#0B0C0E',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Offline shell: cache the built app assets so the portal still
        // loads (even if API calls fail) when there's no connection.
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // Never precache the Firebase messaging worker — serving a stale
        // cached copy of a service worker script silently reverts push
        // fixes and is very hard to diagnose.
        globIgnores: ['**/firebase-messaging-sw.js'],
        navigateFallback: '/index.html',
        // Never cache API calls — admin data must always be fresh.
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
