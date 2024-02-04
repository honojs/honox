import type { FC } from 'hono/jsx'
import type { Manifest } from 'vite'
import { HasIslands } from './has-islands.js'

type Options = {
  src: string
  prod?: boolean
  manifest?: Manifest
}

export const Script: FC<Options> = async (options) => {
  const src = options.src
  if (options.prod ?? import.meta.env.PROD) {
    let manifest: Manifest | undefined = options.manifest
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
      const scriptInManifest = manifest[src.replace(/^\//, '')]
      if (scriptInManifest) {
        return (
          <HasIslands>
            <script type='module' src={`/${scriptInManifest.file}`}></script>
          </HasIslands>
        )
      }
    }
    return <></>
  } else {
    return <script type='module' src={src}></script>
  }
}
