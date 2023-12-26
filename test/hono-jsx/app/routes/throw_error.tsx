import { createHandlers } from '../factory'

export default createHandlers(() => {
  throw new Error('Foo')
})
