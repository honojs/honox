import { createMiddleware } from 'hono/factory'
import { jsxRenderer } from 'hono/jsx-renderer'
import { HasIslands } from '../../../src/server'

const middleware = createMiddleware(async (c, next) => {
  c.res.headers.append('HeaderFromRenderer', 'Hi')
  const renderer = jsxRenderer(
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
  await renderer(c, next)
})

export default middleware
