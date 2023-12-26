import type { ErrorHandler } from 'hono'

const handler: ErrorHandler = (error, c) => {
  return c.render(<h1>Custom Error Message: {error.message}</h1>, {
    title: 'Internal Server Error',
  })
}

export default handler
