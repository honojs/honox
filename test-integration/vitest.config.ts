import path from 'path'
import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vitest/config'
import { injectImportingIslands } from '../src/vite/inject-importing-islands'
import { islandComponents } from '../src/vite/island-components'

const root = './mocks'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../mocks/app-alias'),
    },
  },
  plugins: [
    islandComponents({
      isIsland: (id) => {
        const resolvedPath = path.resolve(root).replace(/\\/g, '\\\\')
        const regexp = new RegExp(`${resolvedPath}/app[^\\\\/]*[\\\\/]islands[\\\\/].+\.tsx?$`)
        return regexp.test(path.resolve(id))
      },
    }),
    injectImportingIslands(),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
