import { defineConfig } from 'vite'
import path from 'path'
import honox from '../src/vite'

export default defineConfig({
  root: './app-renderer-react',
  resolve: { alias: { 'honox/vite': path.resolve(__dirname, '../src/vite') } },
  ssr: { external: ['react', 'react-dom'] },
  optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime'] },
  plugins: [
    honox({
      entry: './server.ts',
      jsxImportSource: 'react',
      islandComponents: { islandDir: '/islands' },
      client: { input: ['/client.ts'] },
    }),
  ],
})
