/** @jsxImportSource solid-js */
import { createMiddleware } from 'hono/factory'
import { HydrationScript, renderToString } from 'solid-js/web'

export default createMiddleware(async (c, next) => {
  c.setRenderer(((content: unknown) =>
    c.html(
      '<!DOCTYPE html>' +
        renderToString(() => (
          <html>
            <head>
              <HydrationScript />
            </head>
            <body>
              {content as never}
              <script type='module' src='/client.ts' />
            </body>
          </html>
        ))
    )) as never)
  await next()
})
