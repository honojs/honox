import { jsxRenderer } from 'hono/jsx-renderer'
import { HasIslands } from '../../../src/server'

export default jsxRenderer(
  ({ children }) => {
    return (
      <html>
        <body>
          {children}
          <HasIslands>
            <script type='module' async src='/app/client.ts'></script>
          </HasIslands>
        </body>
      </html>
    )
  },
  {
    docType: false,
  }
)
