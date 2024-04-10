import { Hono } from 'hono'
import { poweredBy } from 'hono/powered-by'

const app = new Hono()

app.use('*', poweredBy())

app.get('/', (c) =>
  c.json({
    path: '/middleware',
  })
)

app.get('/foo', (c) =>
  c.json({
    path: '/middleware/foo',
  })
)

export default app
