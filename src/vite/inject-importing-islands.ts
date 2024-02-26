import dependencyTree from 'dependency-tree'
import MagicString from 'magic-string'
import { normalizePath, type Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'

export function injectImportingIslands(): Plugin {
  const visited = {}
  const isIslandRegex = new RegExp(/\/islands\//)
  const routesRegex = new RegExp(/routes\/.*\.[t|j]sx$/)

  return {
    name: 'inject-importing-islands',
    transform(sourceCode, id) {
      if (!routesRegex.test(id)) {
        return
      }

      const hasIslandsImport = dependencyTree
        .toList({
          filename: id,
          directory: '.',
          visited,
        })
        .some((x) => isIslandRegex.test(normalizePath(x)))

      if (!hasIslandsImport) {
        return
      }

      const islandEnabledSource = new MagicString(sourceCode)
      islandEnabledSource.append(`export const ${IMPORTING_ISLANDS_ID} = true;`)

      return { code: islandEnabledSource.toString(), map: islandEnabledSource.generateMap() }
    },
  }
}
