import type { Manifest } from 'vite'
import { getServerRenderer } from '../renderer-context.js'
import { ensureTrailngSlash } from '../utils/path.js'

type Options = {
  href?: string
  manifest?: Manifest
  prod?: boolean
  [attribute: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Link = (options: Options): any => {
  const renderer = getServerRenderer()
  let { href, prod, manifest, ...rest } = options
  if (href) {
    if (prod ?? import.meta.env.PROD) {
      if (!manifest) {
        const MANIFEST = import.meta.glob<{ default: Manifest }>('/dist/.vite/manifest.json', {
          eager: true,
        })
        for (const [, manifestFile] of Object.entries(MANIFEST)) {
          if (manifestFile['default']) {
            manifest = manifestFile['default']
            break
          }
        }
      }
      if (manifest) {
        const assetInManifest = manifest[href.replace(/^\//, '')]
        if (assetInManifest) {
          if (href.startsWith('/')) {
            return renderer.createElement('link', {
              href: `${ensureTrailngSlash(import.meta.env.BASE_URL)}${assetInManifest.file}`,
              ...rest,
            })
          }

          return renderer.createElement('link', { href: assetInManifest.file, ...rest })
        }
      }
      return null
    } else {
      return renderer.createElement('link', { href, ...rest })
    }
  }

  return renderer.createElement('link', rest)
}
