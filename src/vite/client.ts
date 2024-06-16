import type { Plugin } from 'vite'

export type ClientOptions = {
  jsxImportSource?: string
  assetsDir?: string
  input?: string[]
}

export const defaultOptions: ClientOptions = {
  jsxImportSource: 'hono/jsx/dom',
  assetsDir: 'static',
  input: [],
}

function client(options?: ClientOptions): Plugin {
  return {
    name: 'honox-vite-client',
    apply: (_config, { command, mode }) => {
      if (command === 'build' && mode === 'client') {
        return true
      }
      return false
    },
    config: () => {
      const input = options?.input ?? defaultOptions.input ?? []
      return {
        build: {
          rollupOptions: {
            input: ['/app/client.ts', ...input],
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
