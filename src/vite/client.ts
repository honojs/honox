import type { Plugin } from 'vite'

type Options = {
  jsxImportSource?: string
  assetsDir?: string
}

export const defaultOptions: Options = {
  jsxImportSource: 'hono/jsx/dom',
  assetsDir: 'static',
}

function client(options?: Options): Plugin {
  return {
    name: 'honox-vite-client',
    config: () => {
      return {
        build: {
          rollupOptions: {
            input: ['/app/client.ts'],
          },
          assetsDir: options?.assetsDir ?? defaultOptions.assetsDir,
          manifest: true,
        },
        esbuild: {
          jsxImportSource: options?.jsxImportSource ?? defaultOptions.jsxImportSource,
        },
      }
    },
  }
}

export default client
