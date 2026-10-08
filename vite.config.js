import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiDocs from './scripts/vite-plugin-api-docs.js'

// https://vite.dev/config/
export default defineConfig({
  // apiDocs puts server/docs into dist/api-docs, so one build output runs on both hosts.
  plugins: [react(), apiDocs()],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['server/**', 'node_modules/**'],
  },
})
