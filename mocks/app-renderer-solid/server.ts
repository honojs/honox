import { createComponent } from 'solid-js'
import { renderToString, ssrElement } from 'solid-js/web'
import { createApp } from '../../src/server'
import type { IslandState, ServerRenderer } from '../../src/types.js'
import * as layout from './routes/_renderer'
import * as route from './routes/index'

let islandState: IslandState = { inIsland: false, inChildren: false }

const createElement = (type: unknown, props: Record<string, unknown> = {}) => {
  if (typeof type === 'function') {
    return createComponent(type as never, props)
  }
  const { children, ...attributes } = props
  delete attributes.key
  return ssrElement(type as string, attributes, children, false)
}

export default createApp({
  root: './routes',
  ROUTES: { './routes/index.tsx': route },
  RENDERER: { './routes/_renderer.tsx': layout },
  renderer: {
    createElement,
    isElement: (value) =>
      typeof value === 'function' || (typeof value === 'object' && value !== null && 't' in value),
    island: {
      useState: () => islandState,
      wrap: (create, state) => {
        const previous = islandState
        islandState = state
        try {
          return create()
        } finally {
          islandState = previous
        }
      },
    },
    renderRoot: (createRoot, createTemplates, root) => ({
      innerHTML:
        renderToString(createRoot, { renderId: root.id }) +
        renderToString(() => createTemplates(), { renderId: `${root.id}-templates` }),
    }),
  } satisfies ServerRenderer,
})
