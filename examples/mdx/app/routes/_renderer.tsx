import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(
  ({ children, title, frontmatter }) => {
    return (
      <html lang='en'>
        <head>
          <meta charset='UTF-8' />
          <meta name='viewport' content='width=device-width, initial-scale=1.0' />
          {<title>{title ?? frontmatter?.title ?? 'My Blog'}</title>}
          <link rel='stylesheet' href='/static/style.css' />
        </head>
        <body>
          <header>
            <h1>
              <a href='/'>My Blog</a>
            </h1>
          </header>
          <main>
            <article>{children}</article>
          </main>
          <footer>
            <p>&copy; 2024 My Blog. All rights reserved.</p>
          </footer>
        </body>
      </html>
    )
  },
  {
    docType: true,
  }
)
