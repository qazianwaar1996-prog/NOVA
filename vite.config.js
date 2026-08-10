import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['.e2b.app', 'localhost', '.local'],
  },
  plugins: [
    react(),
  ],
  base: '/NOVA/',
})
