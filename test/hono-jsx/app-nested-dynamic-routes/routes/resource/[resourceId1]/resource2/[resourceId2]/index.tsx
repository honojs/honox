import { createRoute } from '../../../../../../../../src/factory'

export default createRoute((c) => {
  const { resourceId1, resourceId2 } = c.req.param()
  return c.render(
    <b>
      Resource2 Id {resourceId1} / {resourceId2}
    </b>,
    {
      title: `Resource2 Id ${resourceId1}/${resourceId2}`,
    }
  )
})
