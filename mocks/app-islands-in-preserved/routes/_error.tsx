import type { ErrorHandler } from 'hono'
import Counter from '../islands/Counter'

const handler: ErrorHandler = (e, c) => {
  return c.render(<Counter />, {
    title: 'Internal Server Error',
  })
}

export default handler
