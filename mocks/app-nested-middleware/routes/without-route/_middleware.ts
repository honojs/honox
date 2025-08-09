import { createMiddleware } from 'hono/factory'

export default [
  createMiddleware(async (c, next) => {
    await next()
    c.header('grandparent-middleware-applied', 'true', { append: true })
  }),
]
