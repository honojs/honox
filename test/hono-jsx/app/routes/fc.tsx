import type { Context } from 'hono'

// Export a function
export default function FC(c: Context) {
  return <h1>Function from {c.req.path}</h1>
}
