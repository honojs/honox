import { defineConfig } from 'vite'
import path from 'path'
import honox from '../src/vite'

export default defineConfig({
  root: './app-renderer-preact',
  resolve: { alias: { 'honox/vite': path.resolve(__dirname, '../src/vite') } },
  ssr: { external: ['preact', 'preact-render-to-string'] },
  optimizeDeps: { include: ['preact', 'preact/hooks', 'preact/jsx-dev-runtime'] },
  plugins: [
    honox({
      entry: './server.ts',
      jsxImportSource: 'preact',
      islandComponents: { islandDir: '/islands' },
      client: { input: ['/client.ts'] },
    }),
  ],
})
