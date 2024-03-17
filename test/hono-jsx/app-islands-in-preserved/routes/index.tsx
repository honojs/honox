import { createRoute } from '../../../../src/factory'

export default createRoute((c) => {
  return c.render(<h1>Hello</h1>, {
    title: 'This is a title',
  })
})
