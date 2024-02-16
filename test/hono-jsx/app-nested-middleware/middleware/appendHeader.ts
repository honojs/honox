import { MiddlewareHandler } from "hono"

export const headerMiddleware: (headerName: string) => MiddlewareHandler = (headerName: string) => (ctx, next) => {
    ctx.res.headers.append(headerName, headerName)
    return next()
}
