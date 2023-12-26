import { createHandlers } from '../factory'

export default createHandlers((c) => {
  return c.render(<h1>Hello</h1>, {
    title: 'This is a title',
  })
})
