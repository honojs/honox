import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children }) => {
  return (
    <html>
      <body>
        <div id='root'>{children}</div>
        <div data-testid='renderer-loaded'>_renderer.tsx</div>
      </body>
    </html>
  )
})
