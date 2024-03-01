import path from 'path'
import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vitest/config'
import { injectImportingIslands } from '../../src/vite/inject-importing-islands'
import { islandComponents } from '../../src/vite/island-components'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app-alias'),
    },
  },
  plugins: [
    islandComponents(),
    injectImportingIslands(),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
