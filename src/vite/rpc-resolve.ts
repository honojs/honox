import path from 'node:path'
import type { Plugin } from 'vite'
import { filePathToPath } from '../utils/file'

const routesDir = path.resolve('app/routes')

export const rpcResolve = (): Plugin => ({
  name: 'honox-rpc-resolve',
  enforce: 'pre',
  resolveId (id) {
    if (id.startsWith('virtual:honox-rpc')) {
      return id
    }
  },
  load (id, option) {
    if (id.startsWith('virtual:honox-rpc')) {
      const filePath = id.replace('virtual:honox-rpc?', '')
      const routeRelativeFilePath = path.relative(routesDir, filePath)
      
      const targetUrlPath = filePathToPath(routeRelativeFilePath)
      return `export default "${targetUrlPath.replaceAll('"', '\\"')}"`
    }
  }
})