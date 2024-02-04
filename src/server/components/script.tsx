import type { FC } from 'hono/jsx'
import type { Manifest } from 'vite'

export const Script: FC<{ src: string }> = async ({ src }) => {
  if (import.meta.env.PROD) {
    // @ts-expect-error not typed
    const manifest = await import('/dist/.vite/manifest.json')
    const manifestDefault: Manifest = manifest['default']
    const scriptInManifest = manifestDefault[src.replace(/^\//, '')]
    if (scriptInManifest) {
      return <script type='module' src={`/${scriptInManifest.file}`}></script>
    } else {
      return <></>
    }
  } else {
    return <script type='module' src={src}></script>
  }
}
