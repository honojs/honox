import { builtinModules } from 'module'
import path from 'path'
import devServer, { defaultOptions as devServerDefaultOptions } from '@hono/vite-dev-server'
import type { DevServerOptions } from '@hono/vite-dev-server'
import type { PluginOption } from 'vite'
import { islandComponents } from './island-components.js'

type HonoXOptions = {
  islands?: boolean
  entry?: string
  devServer?: DevServerOptions
  external?: string[]
}

export const defaultOptions: HonoXOptions = {
  islands: true,
  entry: path.join(process.cwd(), './app/server.ts'),
  external: ['react', 'react-dom'],
}

function honox(options?: HonoXOptions): PluginOption[] {
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

  return [
    {
      name: 'honox-vite-config',
      config: () => {
        return {
          ssr: {
            noExternal: true,
            external: defaultOptions.external,
          },
          build: {
            ssr: entry,
            rollupOptions: {
              external: [...builtinModules, /^node:/],
              input: entry,
            },
          },
        }
      },
    },
    ...plugins,
  ]
}

export { devServerDefaultOptions, islandComponents }

export default honox
