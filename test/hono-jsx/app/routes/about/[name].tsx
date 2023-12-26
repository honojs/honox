import Badge from '../../components/Badge'
import { createHandlers } from '../../factory'

export const POST = createHandlers((c) => {
  return c.text('Created!', 201)
})

export default createHandlers((c) => {
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
