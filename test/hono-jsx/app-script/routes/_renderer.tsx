import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from '../../../../src/server'

export default jsxRenderer(
  ({ children }) => {
    return (
      <html>
        <head>
          <Script
            src='/app/client.ts'
            prod={true}
            manifest={{
              'app/client.ts': {
                file: 'static/client-abc.js',
                css: ['/static/style.css'],
              },
            }}
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
