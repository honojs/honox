import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html>
      <head>
        <title>{title}</title>
        <script type='module' src='/app/client.ts'></script>
      </head>
      <body>{children}</body>
    </html>
  )
})
