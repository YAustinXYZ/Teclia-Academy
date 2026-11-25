import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 4173,
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      },
      // Local avatars/files when Backend LOCAL_UPLOADS=true
      '/uploads': {
        target: process.env.VITE_DEV_API_PROXY || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
