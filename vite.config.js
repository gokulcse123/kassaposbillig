import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://13.200.71.164:9001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})