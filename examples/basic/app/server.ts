import { serveStatic } from 'hono/cloudflare-pages'
import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'

const app = createApp({
  init: (app) => app.get('/static/*', serveStatic()),
})

showRoutes(app)

export default app
