import { createMiddleware } from 'hono/factory'
import { createRoute } from '../../../src/factory'

const addHeader = createMiddleware(async (c, next) => {
  await next()
  c.res.headers.set('x-message', 'from middleware')
})

export default createRoute(addHeader)
