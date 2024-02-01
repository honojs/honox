import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vitest/config'
import { injectImportingIslands } from '../../src/vite/inject-importing-islands'
import { islandComponents } from '../../src/vite/island-components'

export default defineConfig({
  plugins: [
    islandComponents(),
    injectImportingIslands(),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
