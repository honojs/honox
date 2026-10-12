/** @jsxImportSource react */
import { reactRenderer } from '@hono/react-renderer'

export default reactRenderer(({ children }) => (
  <html>
    <body>
      {children}
      <script type='module' src='/client.ts' />
    </body>
  </html>
))
