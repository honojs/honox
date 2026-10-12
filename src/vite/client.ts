import type { Plugin } from 'vite'

export type ClientOptions = {
  assetsDir?: string
  input?: string[]
}

const defaultOptions: Required<ClientOptions> = {
  assetsDir: 'static',
  input: ['/app/client.ts'],
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
      return {
        build: {
          rollupOptions: {
            input: options?.input ?? defaultOptions.input,
          },
          assetsDir: options?.assetsDir ?? defaultOptions.assetsDir,
          manifest: true,
        },
      }
    },
  }
}

export default client
