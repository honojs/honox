import path from 'path'
import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import honox from '../src/vite'

export default defineConfig({
  resolve: {
    alias: {
      'honox/vite': path.resolve(__dirname, '../src/vite'),
    },
  },
  plugins: [
    honox({
      entry: './app/server.ts',
    }),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
