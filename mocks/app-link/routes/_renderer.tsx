import { jsxRenderer } from 'hono/jsx-renderer'
import { Link } from '../../../src/server'

export default jsxRenderer(
  ({ children }) => {
    return (
      <html>
        <head>
          <Link
            href='/app/globals.css'
            rel='stylesheet'
            prod={true}
            manifest={{ 'app/globals.css': { file: 'static/globals-abc.css' } }}
          />
        </head>
        <body>{children}</body>
      </html>
    )
  },
  {
    docType: false,
  }
)
