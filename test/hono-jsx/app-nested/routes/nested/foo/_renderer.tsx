import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(
  ({ children, Layout }) => {
    return (
      <Layout>
        <>
          <nav>foo menu</nav>
          {children}
        </>
      </Layout>
    )
  },
  {
    docType: false,
  }
)
