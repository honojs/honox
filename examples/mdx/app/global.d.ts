import {} from 'hono'
import type { Meta } from './types'

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      meta?: Meta & { frontmatter: Meta }
    ): Response | Promise<Response>
  }
}
