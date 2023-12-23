import type { NotFoundHandler } from 'hono'

const handler: NotFoundHandler = (c) => {
  return c.render(<h1>Not Found</h1>, {
    title: 'Not Found',
  })
}

export default handler
