import { getCurrentInstance, h, inject, isVNode, provide } from 'vue'
import type { InjectionKey, VNode } from 'vue'
import { createApp } from '../../src/server'
import type { IslandState, ServerRenderer } from '../../src/types.js'
import * as layout from './routes/_renderer'
import * as route from './routes/index'

const IslandContext: InjectionKey<IslandState> = Symbol()

export default createApp({
  root: './routes',
  ROUTES: { './routes/index.tsx': route },
  RENDERER: { './routes/_renderer.tsx': layout },
  renderer: {
    createElement: (type, props) => {
      const { children, ...rest } = props ?? {}
      return typeof type === 'string' ? h(type, rest, children) : h(type, props)
    },
    isElement: isVNode,
    island: {
      useState: () => inject(IslandContext, { inIsland: false, inChildren: false }),
      wrap: (create, state) =>
        h({
          setup: () => {
            provide(IslandContext, state)
            return create
          },
        }),
    },
    renderRoot: (createRoot, createTemplates, root) => ({
      children: [
        h({
          setup: () => {
            const instance = getCurrentInstance()!
            // Vue has no public per-subtree ID seed; an island starts a new root.
            Object.assign(instance, { ids: ['', 0, 0] })
            instance.appContext = {
              ...instance.appContext,
              config: { ...instance.appContext.config, idPrefix: root.id },
            }
            return createRoot
          },
        }),
        ...createTemplates(),
      ],
    }),
  } satisfies ServerRenderer<VNode>,
})
