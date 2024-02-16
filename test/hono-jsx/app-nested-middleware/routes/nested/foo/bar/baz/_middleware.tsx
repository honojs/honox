import { MiddlewareHandler } from "hono"

const headerMiddleware: MiddlewareHandler = (ctx,next) => {
    ctx.res.headers.append('baz', 'baz')
    return next()
}

export default [headerMiddleware]