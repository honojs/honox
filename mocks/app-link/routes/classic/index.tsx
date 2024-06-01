import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.render(
    <main>
      <div />
    </main>
  )
})

export default app
