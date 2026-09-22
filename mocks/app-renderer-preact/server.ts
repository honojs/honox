import { Fragment, createContext, createElement, isValidElement } from 'preact'
import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import renderToString from 'preact-render-to-string'
import { createApp } from '../../src/server'
import type { IslandState, ServerRenderer } from '../../src/types.js'
import { seedRoot } from './root.js'
import * as layout from './routes/_renderer'
import * as route from './routes/index'

const IslandContext = createContext<IslandState>({ inIsland: false, inChildren: false })

export default createApp({
  root: './routes',
  ROUTES: { './routes/index.tsx': route },
  RENDERER: { './routes/_renderer.tsx': layout },
  renderer: {
    createElement,
    isElement: isValidElement,
    island: {
      useState: () => useContext(IslandContext),
      wrap: (create, state) => createElement(IslandContext.Provider, { value: state }, create()),
    },
    renderRoot: (createRoot, createTemplates, root) => ({
      dangerouslySetInnerHTML: {
        __html:
          renderToString(seedRoot(createRoot(), root.id)) +
          renderToString(createElement(Fragment, null, ...createTemplates())),
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } satisfies ServerRenderer<VNode<any>>,
})
