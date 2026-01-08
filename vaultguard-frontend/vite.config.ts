// vaultguard-frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    watch: {
      usePolling: true, // Required for Docker hot reload to catch file saves
    },
  },
})