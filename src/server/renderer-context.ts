import { AsyncLocalStorage } from 'node:async_hooks'
import type { ServerRenderer } from '../types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyServerRenderer = ServerRenderer<any>
type RendererContext = { renderer: AnyServerRenderer; rootId: number }

const rendererStorage = new AsyncLocalStorage<RendererContext>()

const getRendererContext = () => {
  const context = rendererStorage.getStore()
  if (!context) throw new Error('HonoX server renderer context is missing')
  return context
}

export const getServerRenderer = () => getRendererContext().renderer
export const createIslandRoot = () => {
  const context = getRendererContext()
  return { id: `honox-${context.rootId++}` }
}
export const withServerRenderer = <T>(renderer: AnyServerRenderer, callback: () => T) =>
  rendererStorage.run({ renderer, rootId: 0 }, callback)
