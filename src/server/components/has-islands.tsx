import { useRequestContext } from 'hono/jsx-renderer'
import { IMPORTING_ISLANDS_ID } from '../../constants.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HasIslands = ({ children }: { children: any }): any => {
  const c = useRequestContext()
  return <>{c.get(IMPORTING_ISLANDS_ID) ? children : <></>}</>
}
