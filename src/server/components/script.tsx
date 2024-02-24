import type { Child, FC } from 'hono/jsx'
import type { Manifest } from 'vite'
import { HasIslands } from './has-islands.js'

type Options = {
  src: string
  async?: boolean
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
        const elements: Child[] = []

        // May make it optional to output CSS or not depending on user feedback.
        if (scriptInManifest.css) {
          for (const css of scriptInManifest.css) {
            elements.push(<link href={css} rel='stylesheet' />)
          }
        }

        elements.push(
          <HasIslands>
            <script
              type='module'
              async={!!options.async}
              src={`/${scriptInManifest.file}`}
            ></script>
          </HasIslands>
        )

        return (
          <>
            {elements.map((element) => {
              return <>{element}</>
            })}
          </>
        )
      }
    }
    return <></>
  } else {
    return <script type='module' async={!!options.async} src={src}></script>
  }
}
