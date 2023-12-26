import { createHandlers } from '../factory'

export const POST = createHandlers((c) => {
  return c.json(
    {
      message: 'created',
      ok: true,
    },
    201
  )
})

export default createHandlers((c) => {
  c.header('X-Custom', 'Hello')
  return c.json({
    foo: 'bar',
  })
})
