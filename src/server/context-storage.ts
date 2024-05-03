import { AsyncLocalStorage } from 'node:async_hooks'
import type { Context } from 'hono'
export const contextStorage = new AsyncLocalStorage<Context>()
