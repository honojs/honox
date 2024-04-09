import { createRoute } from '../../../../../src/factory'

export default createRoute((c) => {
  return c.render(<div>Create new resource</div>, {
    title: 'Create',
  })
})
