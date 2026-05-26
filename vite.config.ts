import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.PORT) || 5173,
    host: true,
    // Forward /api/* to the local Express server (run `npm start` inside
    // /server). Production builds use the absolute https://api.lamartinasma.com
    // origin via src/utils/apiBase.ts.
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
    },
  },
})
