import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev-only — `vercel dev` has a flaky bug in this version proxying its
  // own frontend (serves 503s for index.html under concurrent requests).
  // Proxying /api to a separate `vercel dev` instance (API routes only,
  // never browsed directly) sidesteps it; has no effect on `vite build`
  // or the real Vercel deployment.
  server: {
    proxy: {
      '/api': 'http://localhost:3371',
    },
  },
})
