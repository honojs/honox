import { createHandlers } from '../../../factory'

export default createHandlers((c) => {
  const { name } = c.req.param()
  return c.render(<b>{name}'s address</b>, {
    title: `${name}'s address`,
  })
})
