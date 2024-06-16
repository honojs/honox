import type { ErrorHandler } from 'hono'

const handler: ErrorHandler = (error, c) => {
  return c.render(<h1>Custom Error in /directory: {error.message}</h1>)
}

export default handler
