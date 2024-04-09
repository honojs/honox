import { createRoute } from '../../../../../../src/factory'

export default createRoute((c) => {
  const { resourceId } = c.req.param()
  return c.render(<b>Resource Id {resourceId}</b>, {
    title: `Resource Id ${resourceId}`,
  })
})
