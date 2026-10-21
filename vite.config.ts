/// <reference types="vitest" />
import { readFile } from 'node:fs/promises'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Lets `import data from './file.ttf?base64'` resolve to the file's contents
 * as a base64 string, identically in builds and in Vitest (Vite's own
 * `?inline` yields a data URL in builds but only a path under Vitest).
 */
function base64Import(): Plugin {
  return {
    name: 'base64-import',
    enforce: 'pre',
    async load(id) {
      const [path, query] = id.split('?')
      if (query !== 'base64') return null
      const data = await readFile(path)
      return `export default ${JSON.stringify(data.toString('base64'))}`
    },
  }
}

export default defineConfig({
  // Public path the app is served from: "/" for Docker/Nginx and local dev,
  // "/<repo>/" for GitHub Pages (set by the Pages workflow).
  base: process.env.BASE_PATH || '/',
  plugins: [base64Import(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: true,
  },
})
