import type { NotFoundHandler } from 'hono'

const handler: NotFoundHandler = (c) => {
  c.res.headers.append('HeaderFrom404', 'Hi')
  return c.render(<h1>Not Found</h1>, {
    title: 'Not Found',
  })
}

export default handler
