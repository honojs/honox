import type { Env } from 'hono'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

const factory = createFactory<Env>()
export const createRoute = factory.createHandlers
export const createHono = () => {
  return new Hono<Env>()
}
