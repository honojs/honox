import h from 'solid-js/h'
import { hydrate } from 'solid-js/web'
import { createClient } from '../../src/client'
import type { ClientRenderer } from '../../src/types.js'

await createClient({
  ISLAND_FILES: { '/islands/IdProbe.tsx': () => import('./islands/IdProbe') },
  renderer: {
    createElement: h,
    hydrateRoot: (element, parent, root) => {
      hydrate(element, parent, { renderId: root.id })
    },
  } satisfies ClientRenderer<ReturnType<typeof h>>,
})
document.body.dataset.clientLoaded = 'true'
