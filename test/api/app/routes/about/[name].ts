import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  const name = c.req.param<'/:name'>('name')
  return c.json({
    path: `/about/${name}`,
  })
})

app.get('/address', (c) => {
  const name = c.req.param<'/:name'>('name')
  return c.json({
    path: `/about/${name}/address`,
  })
})

export default app
