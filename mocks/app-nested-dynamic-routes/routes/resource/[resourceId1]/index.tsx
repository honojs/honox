import { createRoute } from '../../../../../src/factory'

export default createRoute((c) => {
  const { resourceId1 } = c.req.param()
  return c.render(<b>Resource Id {resourceId1}</b>, {
    title: `Resource Id ${resourceId1}`,
  })
})
