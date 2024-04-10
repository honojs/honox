import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) =>
  c.json({
    path: '/',
  })
)

app.get('/foo', (c) =>
  c.json({
    path: '/foo',
  })
)

export default app
