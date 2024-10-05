import { createRoute } from '../../../../../../../src/factory'

export default createRoute((c) => {
  const { name, hobby_name } = c.req.param()
  return c.render(
    <p>
      {name}'s hobby is {hobby_name}
    </p>
  )
})
