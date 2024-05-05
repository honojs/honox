import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  // @ts-expect-error It throws a type error with hono@4.0.3
  const name = c.req.param('name')
  return c.json({
    path: `/about/${name}`,
  })
})

app.get('/address', (c) => {
  // @ts-expect-error It throws a type error with hono@4.0.3
  const name = c.req.param('name')
  return c.json({
    path: `/about/${name}/address`,
  })
})

export default app
