import { Hono, type Input } from 'hono'
import type { Factory } from 'hono/factory'
import type { BlankInput, Env, H, HandlerInterface, HandlerResponse, Schema } from 'hono/types'

interface RpcClient<
  E extends Env,
  I extends Input,
  R extends HandlerResponse<any>
> {
  
}

type Handlers<
  I extends Input = BlankInput,
  R extends HandlerResponse<any> = any
> = [
  H<Env, string, I, any>,
  H<Env, string, any, R>
] /*[
  H<E, any, I>,
  H<E, any, BlankInput, R>
] |[
  H<E, string, I>,
  ...H[],
  H<E, string, BlankInput, R>
] | [
  H<E, string, I, R>
]*/

export const rpc = <
  HandlersType extends Handlers<E, I, R>,
  E extends Env = Env,
  I extends Input = any,
  R extends HandlerResponse<any> = any
>(handlers: HandlersType): RpcClient<E, I, R> => {
  return {}
}
