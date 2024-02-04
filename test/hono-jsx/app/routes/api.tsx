import { createRoute } from '../../../../src/factory'

export const POST = createRoute((c) => {
  return c.json(
    {
      message: 'created',
      ok: true,
    },
    201
  )
})

export default createRoute((c) => {
  c.header('X-Custom', 'Hello')
  return c.json({
    foo: 'bar',
  })
})
