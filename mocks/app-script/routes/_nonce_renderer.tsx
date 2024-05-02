import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from '../../../src/server'

export default jsxRenderer(
  ({ children }) => {
    return (
      <html>
        <body>
          {children}
          <Script
            nonce="hono"
            src='/app/client.ts'
            prod={true}
            manifest={{
              'app/client.ts': {
                file: 'static/client-abc.js',
              },
            }}
          />
        </body>
      </html>
    )
  },
  {
    docType: false,
  }
)
