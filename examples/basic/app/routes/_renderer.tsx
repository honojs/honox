import { jsxRenderer } from 'hono/jsx-renderer'
import { HAS_ISLANDS } from 'honox/server'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang='en'>
      <head>
        <meta charset='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        {title ? <title>{title}</title> : <></>}
        {import.meta.env.PROD ? (
          <HAS_ISLANDS>
            <script type='module' src='/static/client.js'></script>
          </HAS_ISLANDS>
        ) : (
          <script type='module' src='/app/client.ts'></script>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
})
