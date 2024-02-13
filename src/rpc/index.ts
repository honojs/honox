import type { H, TypedResponse, Input } from 'hono/types'

type UnionToAnd<T> = 
  (T extends any ? (k: T) => void : never) extends ((k: infer R) => void) ? R : never

type RpcResponse <R extends Response> = 
  (R extends (TypedResponse<infer TypedType> & { format: 'json' }) ? {
    json (): Promise<TypedType>
  } & Exclude<R, 'json'> : R)

type LastHandler <Handlers extends H[]> = Handlers extends [...H[], infer R] ? R : never
interface RpcClient<
  Handlers extends H[],
  I = UnionToAnd<{[Index in keyof Handlers]: Handlers[Index] extends H<any, any, infer E> ? E : never}[number]>,
  R = LastHandler<Handlers> extends H<any, any, any, infer E> ? E : never
> {
  (opts?: (
    {
      i: I extends Input ? I['in'] : never
    }
  )): R extends Response ? Promise<RpcResponse<R>> : never
}

export const rpc = <
  Handlers extends H[],
>(handlers: Handlers): RpcClient<Handlers> => {
  return {} as RpcClient<Handlers>
}
