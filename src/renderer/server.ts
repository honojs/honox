import { createContext, isValidElement, useContext } from 'hono/jsx'
import type { JSXNode } from 'hono/jsx'
import { jsx } from 'hono/jsx/jsx-runtime'
import type { IslandState, ServerRenderer } from '../types.js'

const IslandContext = createContext<IslandState>({ inIsland: false, inChildren: false })

const renderer: ServerRenderer<JSXNode> = {
  createElement: (type, props) => {
    const { key, ...rest } = props ?? {}
    return jsx(type, rest, key)
  },
  isElement: isValidElement,
  island: {
    useState: () => useContext(IslandContext),
    wrap: (create, state) => jsx(IslandContext.Provider, { value: state, children: create() }),
  },
  renderRoot: (createRoot, createTemplates) => ({
    children: [createRoot(), ...createTemplates()],
  }),
}

export default renderer
