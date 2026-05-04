import type * as BabelGenerator from '@babel/generator'
import { parse } from '@babel/parser'
import {
  booleanLiteral,
  exportNamedDeclaration,
  identifier,
  variableDeclaration,
  variableDeclarator,
} from '@babel/types'
import precinct from 'precinct'
import { normalizePath } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'
import { readFile } from 'fs/promises'
import { createRequire } from 'node:module'
import path from 'path'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
import { matchIslandComponentId } from './utils/path.js'

const require = createRequire(import.meta.url)
const generate: typeof BabelGenerator.default = require('@babel/generator').default

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
  let config: ResolvedConfig
  const resolvedCache = new Map()
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
      })

      const childDeps = await Promise.all(
        currentFileDeps.map(async (file) => {
          const resolvedId = await resolve(file, depPath)
          return await walkDependencyTree(depPath, resolve, resolvedId ?? file)
        })
      )
      deps.push(...childDeps.flat())
      return deps
    } catch {
      // file does not exist or is a directory
      return deps
    }
  }

  return {
    name: 'inject-importing-islands',
    configResolved: async (resolveConfig) => {
      config = resolveConfig
      appPath = path.join(config.root, options?.appDir ?? '/app')
      root = config.root
    },
    async transform(sourceCode, id) {
      if (!path.resolve(id).startsWith(appPath)) {
        return
      }

      const resolve = async (importee: string, importer?: string) => {
        if (resolvedCache.has(importee)) {
          return this.resolve(importee)
        }
        const resolvedId = await this.resolve(importee, importer)
        // Cache to prevent infinite loops in recursive calls.
        resolvedCache.set(importee, true)
        return resolvedId
      }

      const hasIslandsImport = (
        await Promise.all(
          (await walkDependencyTree(id, resolve)).flat().map(async (x) => {
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

      const hasIslandsNode = exportNamedDeclaration(
        variableDeclaration('const', [
          variableDeclarator(identifier(IMPORTING_ISLANDS_ID), booleanLiteral(true)),
        ])
      )
      ast.program.body.push(hasIslandsNode)

      const output = generate(ast, {}, sourceCode)
      return {
        code: output.code,
        map: output.map,
      }
    },
  }
}
