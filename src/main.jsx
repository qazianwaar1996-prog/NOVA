import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '@fontsource/orbitron/500.css'
import '@fontsource/orbitron/600.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/800.css'
import '@fontsource/orbitron/900.css'
import '@fontsource/rajdhani/400.css'
import '@fontsource/rajdhani/500.css'
import '@fontsource/rajdhani/600.css'
import '@fontsource/rajdhani/700.css'
import '@fontsource/share-tech-mono/400.css'
import './index.css'

/*
 * Service worker teardown (runs once, on load).
 *
 * This app registers NO service worker. But a returning visitor may still
 * have an OLD Workbox worker installed from a previous PWA build. That old
 * worker serves a stale precached index.html which points at hashed asset
 * files that no longer exist on the server — the classic "green build but
 * blank page" symptom.
 *
 * Rather than trusting the browser's periodic update check to notice, we
 * actively unregister every worker on this scope and delete every cache.
 * This is the opposite of registration: it guarantees the app is always
 * served fresh from the network.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {})
    if (typeof caches !== 'undefined') {
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => {})
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
