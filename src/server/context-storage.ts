import type { Context } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'
export const contextStorage = new AsyncLocalStorage<Context>()
