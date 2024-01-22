import devServer from '@hono/vite-dev-server'
import mdx from '@mdx-js/rollup'
import { islandComponents } from 'honox/vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from '../../node_modules/vite'
import ssg from './src/vite-plugin'

const entry = './app/server.ts'

export default defineConfig(() => {
  return {
    plugins: [
      islandComponents(),
      devServer({ entry }),
      ssg({ entry }),
      mdx({
        jsxImportSource: 'hono/jsx',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    ],
  }
})
