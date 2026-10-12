import { createSSRApp, h } from 'vue'
import type { VNode } from 'vue'
import { createClient } from '../../src/client'
import type { ClientRenderer } from '../../src/types.js'

await createClient({
  ISLAND_FILES: { '/islands/IdProbe.tsx': () => import('./islands/IdProbe') },
  renderer: {
    createElement: (type, props) => {
      const { children, ...rest } = props ?? {}
      return typeof type === 'string' ? h(type, rest, children) : h(type, props)
    },
    hydrateRoot: (element, parent, root) => {
      const app = createSSRApp({ render: () => element })
      app.config.idPrefix = root.id
      app.mount(parent)
    },
  } satisfies ClientRenderer<VNode>,
})
document.body.dataset.clientLoaded = 'true'
