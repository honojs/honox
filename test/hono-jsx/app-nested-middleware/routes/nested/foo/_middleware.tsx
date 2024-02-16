import { MiddlewareHandler } from "hono"

const headerMiddleware: MiddlewareHandler = (ctx,next) => {
    ctx.res.headers.append('foo', 'foo')
    return next()
}

export default [headerMiddleware]