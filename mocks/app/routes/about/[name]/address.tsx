import { createRoute } from '../../../../../src/factory'

export default createRoute((c) => {
  const { name } = c.req.param()
  return c.render(<b>{name}'s address</b>, {
    title: `${name}'s address`,
  })
})
