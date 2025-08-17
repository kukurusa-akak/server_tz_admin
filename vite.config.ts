import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'spa', // Enable SPA fallback
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
