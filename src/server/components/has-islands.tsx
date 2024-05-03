import type { FC } from 'hono/jsx'
import { IMPORTING_ISLANDS_ID } from '../../constants.js'
import { contextStorage } from '../context-storage.js'

export const HasIslands: FC = ({ children }) => {
  const c = contextStorage.getStore()
  if (!c) {
    throw new Error('No context found')
  }
  return <>{c.get(IMPORTING_ISLANDS_ID) && children}</>
}
