import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import path from 'path'
import honox from '../src/vite'

export default defineConfig({
  root: './app-renderer-solid',
  resolve: { alias: { 'honox/vite': path.resolve(__dirname, '../src/vite') } },
  ssr: { external: ['solid-js'] },
  optimizeDeps: { include: ['solid-js', 'solid-js/h', 'solid-js/web'] },
  plugins: [
    honox({
      entry: './server.ts',
      jsxImportSource: 'solid-js',
      islandComponents: { islandDir: '/islands' },
      client: { input: ['/client.ts'] },
    }),
    solid({ ssr: true }),
  ],
})
