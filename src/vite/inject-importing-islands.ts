import { readFile } from 'fs/promises'
import path from 'path'
import MagicString from 'magic-string'
import precinct from 'precinct'
import { normalizePath, type Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants'

export async function injectImportingIslands(): Promise<Plugin> {
  const isIslandRegex = new RegExp(/\/islands\//)
  const routesRegex = new RegExp(/routes\/.*\.[t|j]sx$/)
  const cache: Record<string, string> = {}

  const walkDependencyTree: (
    baseFile: string,
    dependencyFile?: string
  ) => Promise<string[]> = async (baseFile: string, dependencyFile?: string) => {
    const depPath = dependencyFile
      ? path.join(path.dirname(baseFile), dependencyFile) + '.tsx' //TODO: This only includes tsx files, how to also include JSX?
      : baseFile
    const deps = [depPath]

    try {
      if (!cache[depPath]) {
        cache[depPath] = (await readFile(depPath, { flag: '' })).toString()
      }

      const currentFileDeps = precinct(cache[depPath]) as string[]

      const childDeps = await Promise.all(
        currentFileDeps.map(async (x) => await walkDependencyTree(depPath, x))
      )
      deps.push(...childDeps.flat())
      return deps
    } catch (err) {
      // file does not exist or is a directory
      return deps
    }
  }

  return {
    name: 'inject-importing-islands',
    async transform(sourceCode, id) {
      if (!routesRegex.test(id)) {
        return
      }

      const hasIslandsImport = (await walkDependencyTree(id))
        .flat()
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
