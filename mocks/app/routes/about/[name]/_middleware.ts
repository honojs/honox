import { createRoute } from '../../../../../src/factory'
import { createMiddleware } from 'hono/factory'

const addHeader = createMiddleware(async (c, next) => {
  await next()
  console.log('fooo')
  c.res.headers.append('x-message', 'from middleware')
})

export default createRoute(addHeader)
