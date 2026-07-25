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
  const depTreeCache = new Map<string, string[]>()
  // file path -> resolved direct dependencies. Memoized as a promise so that
  // concurrent transforms resolve each file's imports at most once per build.
  // Keyed by the importer file path (not the specifier), so relative specifiers
  // shared across files are always resolved with the correct importer.
  const fileDepsCache = new Map<string, Promise<(ResolvedId | string)[]>>()

  const getFileDeps = (
    depPath: string,
    resolve: (path: string, importer?: string) => Promise<ResolvedId | null>
  ): Promise<(ResolvedId | string)[]> => {
    let deps = fileDepsCache.get(depPath)
    if (!deps) {
      deps = (async () => {
        const source = (await readFile(depPath, { flag: '' })).toString()
        const specifiers = precinct(source, { type: 'tsx' })
        return Promise.all(specifiers.map(async (file) => (await resolve(file, depPath)) ?? file))
      })()
      fileDepsCache.set(depPath, deps)
    }
    return deps
  }

  const walkDependencyTree = async (
    baseFile: string,
    resolve: (path: string, importer?: string) => Promise<ResolvedId | null>
  ): Promise<string[]> => {
    const visited = new Set<string>()

    const walk = async (
      currentFile: string,
      dependencyFile?: ResolvedId | string
    ): Promise<string[]> => {
      const depPath = dependencyFile
        ? typeof dependencyFile === 'string'
          ? path.join(path.dirname(currentFile), dependencyFile) + '.tsx'
          : dependencyFile['id']
        : currentFile

      // island components are never in node_modules;
      // skip to avoid pulling in hundreds of third-party files on every transform call.
      if (depPath.includes('node_modules')) return []

      // return the already-walked subtree instead of re-walking it.
      if (depTreeCache.has(depPath)) return depTreeCache.get(depPath)!

      if (visited.has(depPath)) return []
      visited.add(depPath)

      const deps = [depPath]

      try {
        const resolvedDeps = await getFileDeps(depPath, resolve)

        const childDeps = await Promise.all(resolvedDeps.map((dep) => walk(depPath, dep)))
        deps.push(...childDeps.flat())
        depTreeCache.set(depPath, deps)
        return deps
      } catch {
        // file does not exist or is a directory
        return deps
      }
    }

    return walk(baseFile)
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

      const resolve = (importee: string, importer?: string) => this.resolve(importee, importer)

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
