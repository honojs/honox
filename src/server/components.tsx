import type { FC } from 'hono/jsx'
import { useRequestContext } from 'hono/jsx-renderer'
import { IMPORTING_ISLANDS_ID } from '../constants.js'

export const HasIslands: FC = ({ children }) => {
  const c = useRequestContext()
  return <>{c.get(IMPORTING_ISLANDS_ID) ? children : <></>}</>
}
