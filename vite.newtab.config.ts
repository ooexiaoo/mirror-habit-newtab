import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const extensionDir = path.resolve(rootDir, 'new tab extension')

export default defineConfig({
  root: extensionDir,
  base: './',
  envDir: rootDir,
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(extensionDir, 'dist'),
    emptyOutDir: true,
    target: 'chrome120',
    rollupOptions: {
      input: path.resolve(extensionDir, 'newtab.html'),
    },
  },
})
