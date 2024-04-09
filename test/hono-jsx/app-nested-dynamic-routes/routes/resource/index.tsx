import { createRoute } from '../../../../../src/factory'

export default createRoute((c) => {
  return c.render(<div>Resource Home</div>, {
    title: 'Resource Home',
  })
})
