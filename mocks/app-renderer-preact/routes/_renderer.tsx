/** @jsxImportSource preact */
import { createMiddleware } from 'hono/factory'
import renderToString from 'preact-render-to-string'

export default createMiddleware(async (c, next) => {
  c.setRenderer(((content: unknown) =>
    c.html(
      '<!DOCTYPE html>' +
        renderToString(
          <html>
            <body>
              {content}
              <script type='module' src='/client.ts' />
            </body>
          </html>
        )
    )) as never)
  await next()
})
