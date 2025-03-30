import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(
  ({ children, Layout }) => {
    return (
      <Layout>
        <div>
          <h1>Blog</h1>
          {children}
        </div>
      </Layout>
    )
  },
  { stream: true }
)
