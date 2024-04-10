import { jsxRenderer } from 'hono/jsx-renderer'
import Counter from '../../islands/Counter'

export default jsxRenderer(
  ({ Layout, children }) => {
    return (
      <Layout>
        <Counter />
        <>{children}</>
      </Layout>
    )
  },
  {
    docType: false,
  }
)
