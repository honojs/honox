import { createRoute } from '../../../../src/factory'
import Badge from '../../components/Badge'

export const POST = createRoute((c) => {
  return c.text('Created!', 201)
})

export default createRoute((c) => {
  const { name } = c.req.param()
  return c.render(
    <>
      <p>It's {name}</p>
      <Badge name={name} />
    </>,
    {
      title: name,
    }
  )
})
