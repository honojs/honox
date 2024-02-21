import mdx from '@mdx-js/rollup'
import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'
import honox from '../../src/vite'

export default defineConfig(async () => {
  const { env, dispose } = await getPlatformProxy()
  return {
    plugins: [
      honox({
        entry: './app/server.ts',
        devServer: {
          env,
          plugins: [{ onServerClose: dispose }],
        },
      }),
      mdx({
        jsxImportSource: 'hono/jsx',
      }),
    ],
  }
})
