import { Suspense, createElement, use } from 'react'
import type { ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createClient } from '../../src/client'
import type { ClientRenderer } from '../../src/types.js'

await createClient({
  ISLAND_FILES: { '/islands/IdProbe.tsx': () => import('./islands/IdProbe') },
  renderer: {
    createElement,
    hydrateRoot: (element, parent, root) => {
      hydrateRoot(parent, element, { identifierPrefix: root.id })
    },
    suspense: { component: Suspense, suspend: use },
  } satisfies ClientRenderer<ReactNode>,
})
document.body.dataset.clientLoaded = 'true'
