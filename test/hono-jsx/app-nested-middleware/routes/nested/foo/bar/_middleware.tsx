import { MiddlewareHandler } from "hono"

const headerMiddleware: MiddlewareHandler = (ctx,next) => {
    ctx.res.headers.append('bar', 'bar')
    return next()
}

export default [headerMiddleware]