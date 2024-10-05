import { createMiddleware } from 'hono/factory'
import { createRoute } from '../../../../../../../src/factory'

const addHeader = createMiddleware(async (c, next) => {
  await next()
  c.res.headers.append('x-message-nested', 'from nested middleware')
})

export default createRoute(addHeader)
