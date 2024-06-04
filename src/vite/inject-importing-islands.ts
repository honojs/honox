import { readFile } from 'fs/promises'
import path from 'path'
import _generate from '@babel/generator'
import { parse } from '@babel/parser'
// @ts-expect-error `precinct` is not typed
import precinct from 'precinct'
import {  normalizePath } from 'vite'
import type {Plugin} from 'vite'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
import { matchIslandComponentId } from './utils/path.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

type InjectImportingIslandsOptions = {
  appDir?: string
  islandDir?: string
}

type ResolvedId = {
  id: string
}

export async function injectImportingIslands(
  options?: InjectImportingIslandsOptions
): Promise<Plugin> {
  let appPath = ''
  const islandDir = options?.islandDir ?? '/app/islands'
  let root = ''
  const cache: Record<string, string> = {}

  const walkDependencyTree: (
    baseFile: string,
    resolve: (path: string, importer?: string) => Promise<ResolvedId | null>,
    dependencyFile?: ResolvedId | string
  ) => Promise<string[]> = async (baseFile: string, resolve, dependencyFile?) => {
    const depPath = dependencyFile
      ? typeof dependencyFile === 'string'
        ? path.join(path.dirname(baseFile), dependencyFile) + '.tsx'
        : dependencyFile['id']
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
        currentFileDeps.map(async (file) => {
          const resolvedId = await resolve(file, baseFile)
          return await walkDependencyTree(depPath, resolve, resolvedId ?? file)
        })
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
    configResolved: async (config) => {
      appPath = path.join(config.root, options?.appDir ?? '/app')
      root = config.root
    },
    async transform(sourceCode, id) {
      if (!path.resolve(id).startsWith(appPath)) {
        return
      }

      const hasIslandsImport = (
        await Promise.all(
          (await walkDependencyTree(id, async (id: string) => await this.resolve(id)))
            .flat()
            .map(async (x) => {
              const rootPath = '/' + path.relative(root, normalizePath(x)).replace(/\\/g, '/')
              return matchIslandComponentId(rootPath, islandDir)
            })
        )
      ).some((matched) => matched)

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
