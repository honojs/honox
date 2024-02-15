import path from 'path'
import devServer, { defaultOptions as devServerDefaultOptions } from '@hono/vite-dev-server'
import type { DevServerOptions } from '@hono/vite-dev-server'
import type { PluginOption } from 'vite'
import { injectImportingIslands } from './inject-importing-islands.js'
import { islandComponents } from './island-components.js'
import { restartOnAddUnlink } from './restart-on-add-unlink.js'

type Options = {
  islands?: boolean
  entry?: string
  devServer?: DevServerOptions
  external?: string[]
}

export const defaultOptions: Options = {
  islands: true,
  entry: path.join(process.cwd(), './app/server.ts'),
}

function honox(options?: Options): PluginOption[] {
  const plugins: PluginOption[] = []

  const entry = options?.entry ?? defaultOptions.entry

  plugins.push(
    devServer({
      entry,
      exclude: [
        ...devServerDefaultOptions.exclude,
        /^\/app\/.+/,
        /^\/favicon.ico/,
        /^\/static\/.+/,
      ],
      ...options?.devServer,
    })
  )

  if (options?.islands !== false) {
    plugins.push(islandComponents())
  }

  plugins.push(injectImportingIslands())
  plugins.push(restartOnAddUnlink())

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
