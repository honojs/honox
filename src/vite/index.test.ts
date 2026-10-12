// @vitest-environment node

import { resolveConfig } from 'vite'
import honox from './index'

const serverPlugins = [
  '@hono/vite-dev-server',
  'transform-island-components',
  'inject-importing-islands',
]
const clientPlugins = ['honox-vite-client']
const sharedPlugins = ['honox-vite-config']

const resolveHonox = (mode: string, plugins = honox()) =>
  resolveConfig({ configFile: false, plugins }, 'build', mode)

const pluginNames = async (mode: string) =>
  (await resolveHonox(mode)).plugins.map(({ name }) => name)

it('uses server plugins in production builds', async () => {
  const plugins = await pluginNames('production')

  expect(plugins).toEqual(expect.arrayContaining([...serverPlugins, ...sharedPlugins]))
  expect(plugins.filter((plugin) => clientPlugins.includes(plugin))).toEqual([])
})

it('uses client plugins in client builds', async () => {
  const plugins = await pluginNames('client')

  expect(plugins).toEqual(expect.arrayContaining([...clientPlugins, ...sharedPlugins]))
  expect(plugins.filter((plugin) => serverPlugins.includes(plugin))).toEqual([])
})

it('configures the JSX import source for each build', async () => {
  const jsxImportSource = { server: 'example/server', client: 'example/client' }
  const server = await resolveHonox('production', honox({ jsxImportSource }))
  const client = await resolveHonox('client', honox({ jsxImportSource }))

  expect(server).toMatchObject({ esbuild: { jsxImportSource: 'example/server' } })
  expect(client).toMatchObject({ esbuild: { jsxImportSource: 'example/client' } })
})
