import { createRoute } from '../../../../../../../src/factory'

export default createRoute((c) => {
  const { name, hobby_name } = c.req.param<'/about/:name/hobbies/:hobby_name'>()
  return c.render(
    <p>
      {name}'s hobby is {hobby_name}
    </p>
  )
})
