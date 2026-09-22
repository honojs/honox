import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import path from 'path'
import honox from '../src/vite'

export default defineConfig({
  root: './app-renderer-vue',
  resolve: { alias: { 'honox/vite': path.resolve(__dirname, '../src/vite') } },
  ssr: { external: ['vue'] },
  optimizeDeps: { include: ['vue'] },
  plugins: [
    honox({
      entry: './server.ts',
      jsxImportSource: 'vue',
      islandComponents: { islandDir: '/islands' },
      client: { input: ['/client.ts'] },
    }),
    vueJsx(),
  ],
})
