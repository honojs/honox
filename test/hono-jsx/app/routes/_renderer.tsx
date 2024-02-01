import { jsxRenderer } from 'hono/jsx-renderer'
import { HasIslands } from '../../../../src/server'

export default jsxRenderer(({ children, title }) => {
  return (
    <html>
      <head>
        <title>{title}</title>
        <HasIslands>
          <script type='module' src='/app/client.ts'></script>
        </HasIslands>
      </head>
      <body>{children}</body>
    </html>
  )
})
