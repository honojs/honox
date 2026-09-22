import devServer, { defaultOptions as viteDevServerDefaultOptions } from '@hono/vite-dev-server'
import type { DevServerOptions } from '@hono/vite-dev-server'
import type { PluginOption } from 'vite'
import path from 'path'
import type { ClientOptions } from './client.js'
import client from './client.js'
import { injectImportingIslands } from './inject-importing-islands.js'
import { islandComponents } from './island-components.js'
import type { IslandComponentsOptions } from './island-components.js'
import { restartOnAddUnlink } from './restart-on-add-unlink.js'

type Options = {
  /** JSX import source shared by both builds, or selected separately for server and client builds. */
  jsxImportSource?: string | { server: string; client: string }
  islands?: boolean
  entry?: string
  devServer?: DevServerOptions
  islandComponents?: IslandComponentsOptions
  client?: ClientOptions
  external?: string[]
}

export const defaultOptions = {
  islands: true,
  entry: path.join(process.cwd(), './app/server.ts'),
  jsxImportSource: { server: 'hono/jsx', client: 'hono/jsx/dom' },
}

const devServerDefaultOptions = {
  ...viteDevServerDefaultOptions,
  exclude: [
    ...viteDevServerDefaultOptions.exclude,
    /^\/app\/.+\.tsx?/,
    /^\/favicon.ico/,
    /^\/static\/.+/,
  ],
  handleHotUpdate: () => {
    return undefined
  },
}

function honox(options?: Options): PluginOption[] {
  const plugins: PluginOption[] = []

  const entry = options?.entry ?? defaultOptions.entry
  const jsxImportSource = options?.jsxImportSource ?? defaultOptions.jsxImportSource

  plugins.push({
    ...devServer({
      ...devServerDefaultOptions,
      entry,
      ...options?.devServer,
    }),
    apply: (_config, { command, mode }) => command !== 'build' || mode !== 'client',
  })

  if (options?.islands !== false) {
    plugins.push(islandComponents(options?.islandComponents))
  }

  plugins.push(injectImportingIslands())
  plugins.push(restartOnAddUnlink())
  plugins.push(client(options?.client))

  return [
    {
      name: 'honox-vite-config',
      config: (_config, { command, mode }) => {
        const clientBuild = command === 'build' && mode === 'client'
        return {
          esbuild: {
            jsxImportSource:
              typeof jsxImportSource === 'string'
                ? jsxImportSource
                : clientBuild
                  ? jsxImportSource.client
                  : jsxImportSource.server,
          },
          ...(clientBuild ? {} : { ssr: { noExternal: true } }),
        }
      },
    },
    ...plugins,
  ]
}

export { devServerDefaultOptions, islandComponents }

export default honox
