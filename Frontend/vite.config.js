import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `global` shim is required by sockjs-client. Port 5173 must not change (backend CORS).
export default defineConfig({
  plugins: [react()],
  define: { global: 'globalThis' },
  server: { port: 5173, strictPort: true },
})
