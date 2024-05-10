import path from 'path'
import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vitest/config'
import { injectImportingIslands } from '../src/vite/inject-importing-islands'
import { islandComponents } from '../src/vite/island-components'

const root = './mocks'
const appDir = '/mocks'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../mocks/app-alias'),
      'honox/vite': path.resolve(__dirname, '../src/vite'),
    },
  },
  plugins: [
    islandComponents({
      isIsland: (id) => {
        const resolvedPath = path.resolve(root).replace(/\\/g, '\\\\')
        const regexp = new RegExp(
          `${resolvedPath}[\\\\/]app[^\\\\/]*[\\\\/]islands[\\\\/].+\.tsx?$|${resolvedPath}[\\\\/]app[^\\\\/]*[\\\\/]routes[\\\\/].+\.island\.tsx?$|${resolvedPath}[\\\\/]app[^\\\\/]*[\\\\/]routes[\\\\/].*\\$.+\.tsx?$|${resolvedPath}[\\\\/]app[^\\\\/]*[\\\\/]components[\\\\/].*\\$.+\.tsx?$`
        )
        return regexp.test(path.resolve(id))
      },
      appDir,
    }),
    injectImportingIslands({
      appDir,
    }),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
