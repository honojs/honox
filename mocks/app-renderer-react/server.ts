import { Fragment, createContext, createElement, isValidElement, useContext } from 'react'
import type { ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { createApp } from '../../src/server'
import type { IslandState, ServerRenderer } from '../../src/types.js'
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
          renderToString(createRoot(), { identifierPrefix: root.id }) +
          renderToString(createElement(Fragment, null, ...createTemplates())),
      },
    }),
  } satisfies ServerRenderer<ReactNode>,
})
