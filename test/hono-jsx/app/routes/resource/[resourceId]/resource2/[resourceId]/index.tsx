import { createRoute } from '../../../../../../../../src/factory'

export default createRoute((c) => {
  const { resourceId } = c.req.param()
  return c.render(<b>Resource2 Id {resourceId}</b>, {
    title: `Resource Id ${resourceId}`,
  })
})
