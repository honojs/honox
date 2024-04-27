import type { FC } from 'hono/jsx'
import type { Manifest } from 'vite'
import { HasIslands } from './has-islands.js'

type Options = {
  src: string
  async?: boolean
  prod?: boolean
  manifest?: Manifest
  nonce?: string
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
            <script
              type='module'
              async={!!options.async}
              src={`/${scriptInManifest.file}`}
              nonce={options.nonce}
            ></script>
          </HasIslands>
        )
      }
    }
    return <></>
  } else {
    return <script type='module' async={!!options.async} src={src} nonce={options.nonce}></script>
  }
}
