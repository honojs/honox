import { createElement, hydrate } from 'preact'
import type { VNode } from 'preact'
import { createClient } from '../../src/client'
import type { ClientRenderer } from '../../src/types.js'
import { seedRoot } from './root.js'

await createClient({
  ISLAND_FILES: { '/islands/IdProbe.tsx': () => import('./islands/IdProbe') },
  renderer: {
    createElement,
    hydrateRoot: (element, parent, root) => hydrate(seedRoot(element, root.id), parent),
  } satisfies ClientRenderer<VNode>,
})
document.body.dataset.clientLoaded = 'true'
