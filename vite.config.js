import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/NOVA/',
  // Dev-server only. Has no effect on `vite build` / the deployed bundle,
  // but is required for the app to be previewable from a remote sandbox.
  server: {
    host: true,
    allowedHosts: ['.e2b.app', 'localhost', '.local'],
  },
})
