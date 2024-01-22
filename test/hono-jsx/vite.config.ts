import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import honox from '../../src/vite'

export default defineConfig({
  plugins: [
    honox({
      entry: './app/server.ts',
    }),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
