import { showRoutes } from 'hono/dev'
import { logger } from 'hono/logger'
import { createApp } from '../../src/server'

const ROUTES = import.meta.glob('./routes/**/[a-z[-][a-z[_-]*.(tsx|ts)', {
  eager: true,
})

const RENDERER = import.meta.glob('./routes/**/_renderer.tsx', {
  eager: true,
})

const NOT_FOUND = import.meta.glob('./routes/**/_404.(ts|tsx', {
  eager: true,
})

const ERROR = import.meta.glob('./routes/**/_error.(ts|tsx)', {
  eager: true,
})

const app = createApp({
  // @ts-expect-error type is not specified
  ROUTES,
  // @ts-expect-error type is not specified
  RENDERER,
  // @ts-expect-error type is not specified
  NOT_FOUND,
  // @ts-expect-error type is not specified
  ERROR,
  root: './routes',
  init: (app) => {
    app.use(logger())
  },
})
showRoutes(app, {
  verbose: true,
})

export default app
