import path from 'path'
import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import honox from '../../src/vite'

const root = './'

export default defineConfig({
  plugins: [
    honox({
      entry: './app/server.ts',
      islandComponents: {
        isIsland: (id) => {
          const resolvedPath = path.resolve(root)
          const regexp = new RegExp(`${resolvedPath}/app/islands/.+\.tsx?$`)
          return regexp.test(id)
        },
      },
    }),
    mdx({
      jsxImportSource: 'hono/jsx',
    }),
  ],
})
