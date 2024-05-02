import path from 'path'
import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import honox from '../src/vite'

const root = './'

export default defineConfig({
  resolve: {
    alias: {
      'honox/site': path.resolve(__dirname, '../src/site'),
    },
  },
  plugins: [
    honox({
      entry: './app/server.ts',
      islandComponents: {
        isIsland: (id) => {
          const resolvedPath = path.resolve(root).replace(/\\/g, '\\\\')
          const regexp = new RegExp(
            `${resolvedPath}[\\\\/]app[^\\\\/]*[\\\\/]islands[\\\\/].+\.tsx?$|${resolvedPath}[\\\\/]app[^\\\\/]*[\\\\/]routes[\\\\/].+\.island\.tsx?$`
          )
          return regexp.test(path.resolve(id))
        },
      },
    }),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
