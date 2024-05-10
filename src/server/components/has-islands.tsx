import { IMPORTING_ISLANDS_ID } from '../../constants.js'
import { contextStorage } from '../context-storage.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HasIslands = ({ children }: { children: any }): any => {
  const c = contextStorage.getStore()
  if (!c) {
    throw new Error('No context found')
  }
  return <>{c.get(IMPORTING_ISLANDS_ID) && children}</>
}
