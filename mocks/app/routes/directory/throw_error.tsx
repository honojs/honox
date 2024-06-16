import { createRoute } from '../../../../src/factory'

export default createRoute(() => {
  throw new Error('Foo')
})
