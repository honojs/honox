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
  islands?: boolean
  entry?: string
  devServer?: DevServerOptions
  islandComponents?: IslandComponentsOptions
  client?: ClientOptions
  external?: string[]
}

export const defaultOptions: Options = {
  islands: true,
  entry: path.join(process.cwd(), './app/server.ts'),
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
  }
}

function honox(options?: Options): PluginOption[] {
  const plugins: PluginOption[] = []

  const entry = options?.entry ?? defaultOptions.entry

  plugins.push(
    devServer({
      ...devServerDefaultOptions,
      entry,
      ...options?.devServer,
    })
  )

  if (options?.islands !== false) {
    plugins.push(islandComponents(options?.islandComponents))
  }

  plugins.push(injectImportingIslands())
  plugins.push(restartOnAddUnlink())
  plugins.push(client(options?.client))

  return [
    {
      name: 'honox-vite-config',
      config: () => {
        return {
          ssr: {
            noExternal: true,
          },
        }
      },
    },
    ...plugins,
  ]
}

export { devServerDefaultOptions, islandComponents }

export default honox
