// eslint-disable-next-line node/no-extraneous-import
import 'hono'
import type { Meta } from './types'

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      meta?: Meta & { frontmatter: Meta }
    ): Response | Promise<Response>
  }
}
