import type { NotFoundHandler } from 'hono'
import Counter from '../islands/Counter'

const handler: NotFoundHandler = (c) => {
  return c.render(<Counter />, {
    title: 'Not Found',
  })
}

export default handler
