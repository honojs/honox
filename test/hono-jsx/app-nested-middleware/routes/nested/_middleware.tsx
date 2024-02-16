import { MiddlewareHandler } from "hono"

const headerMiddleware: MiddlewareHandler = (ctx,next) => {
    ctx.res.headers.append('root', 'root')
    return next()
}

export default [headerMiddleware]