import { createMiddleware } from 'hono/factory'

export default [
  createMiddleware(async (c, next) => {
    await next()
    c.header('X-Admin-Middleware', 'true', { append: true })
  }),
]
