import { Hono } from 'hono'
import Component from '../../islands/Component'

const app = new Hono()

app.get('/', (c) => {
  return c.render(
    <main>
      <Component />
    </main>
  )
})

export default app
