import devServer from '@hono/vite-dev-server'
import ssg from '@hono/vite-ssg'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from '../../node_modules/vite'
import honox from '../../src/vite'

const entry = './app/server.ts'

export default defineConfig(() => {
  return {
    plugins: [
      honox(),
      devServer({ entry }),
      ssg({ entry }),
      mdx({
        jsxImportSource: 'hono/jsx',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
      }),
    ],
  }
})
