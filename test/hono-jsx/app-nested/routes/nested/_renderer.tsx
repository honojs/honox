import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(
  ({ children }) => {
    return (
      <main>
        <>{children}</>
      </main>
    )
  },
  {
    docType: false,
  }
)
