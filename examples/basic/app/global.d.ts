import type {} from 'hono'

type Props = {
  title?: string
}

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: Props): Response | Promise<Response>
  }
}
