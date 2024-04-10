import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <h1>About</h1>
        <address>{children}</address>
      </body>
    </html>
  )
})
