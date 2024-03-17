import { readFile } from 'fs/promises'
import path from 'path'
import _generate from '@babel/generator'
import { parse } from '@babel/parser'
// @ts-expect-error `precinct` is not typed
import precinct from 'precinct'
import { normalizePath, type Plugin } from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

export async function injectImportingIslands(): Promise<Plugin> {
  const isIslandRegex = new RegExp(/\/islands\//)
  const fileRegex = new RegExp(/(routes|_renderer|_error|_404)\/.*\.[tj]sx$/)
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

      const currentFileDeps = precinct(cache[depPath], {
        type: 'tsx',
      }) as string[]

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
      if (!fileRegex.test(id)) {
        return
      }

      const hasIslandsImport = (await walkDependencyTree(id))
        .flat()
        .some((x) => isIslandRegex.test(normalizePath(x)))

      if (!hasIslandsImport) {
        return
      }

      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })

      const hasIslandsNode = {
        type: 'ExportNamedDeclaration',
        declaration: {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: IMPORTING_ISLANDS_ID },
              init: { type: 'BooleanLiteral', value: true },
            },
          ],
          kind: 'const',
        },
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ast.program.body.push(hasIslandsNode as any)

      const output = generate(ast, {}, sourceCode)
      return {
        code: output.code,
        map: output.map,
      }
    },
  }
}
