import { showRoutes } from 'hono/dev'
import { createApp } from '../../../src/server'

const app = createApp()

showRoutes(app)

export default app
