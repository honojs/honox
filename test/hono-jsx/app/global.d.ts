import type {} from 'hono'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, head?: { title?: string }): Response
  }
}
