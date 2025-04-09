import { jsxRenderer } from 'hono/jsx-renderer'
import { HasIslands } from '../../../src/server'

export default jsxRenderer(
  ({ children, title }) => {
    return (
      <html>
        <head>
          <title>{title}</title>
        </head>
        <body>
          {children}
          <HasIslands>
            <script type='module' async src='/app/client.ts'></script>
          </HasIslands>
        </body>
      </html>
    )
  },
  { stream: true }
)
