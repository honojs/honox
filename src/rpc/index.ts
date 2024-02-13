import type { H, Input, TypedResponse, ValidationTargets } from 'hono/types'

type UnionToAnd<T> = (T extends any ? (k: T) => void : never) extends (k: infer R) => void
  ? R
  : never

type RpcResponse<R extends Response> = R extends TypedResponse<infer TypedType> & { format: 'json' }
  ? {
      json(): Promise<TypedType>
    } & Exclude<R, 'json'>
  : R

type LastHandler<Handlers extends H[]> = Handlers extends [...H[], infer R] ? R : never
interface RpcClient<
  Handlers extends H[],
  I = UnionToAnd<
    {
      [Index in keyof Handlers]: Handlers[Index] extends H<any, any, infer E> ? E : never
    }[number]
  >,
  R = LastHandler<Handlers> extends H<any, any, any, infer E> ? E : never,
> {
  (
    opts?: I extends Input ? I['in'] : never,
    init?: RequestInit
  ): R extends Response ? Promise<RpcResponse<R>> : never
}

export const rpc = <Handlers extends H[]>(handlers: Handlers | string): RpcClient<Handlers> => {
  if (typeof handlers !== 'string') {
    throw new TypeError('RPC argment must be string. Are you using HonoX Vite Plugin?')
  }
  return (async (opts, init) => {
    const requestInit: RequestInit = init ?? {}

    if (opts?.json) {
      requestInit.body = JSON.stringify(opts)
    }

    return await fetch(handlers, requestInit)
  }) as RpcClient<Handlers>
}
