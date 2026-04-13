// @ts-expect-error don't use types
import _generate from '@babel/generator'
import { parse } from '@babel/parser'
import precinct from 'precinct'
import { normalizePath } from 'vite'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { readFile } from 'fs/promises'
import path from 'path'
import { IMPORTING_ISLANDS_ID } from '../constants.js'
import { matchIslandComponentId } from './utils/path.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const generate = (_generate.default as typeof _generate) ?? _generate

export type InjectImportingIslandsOptions = {
  appDir?: string
  islandDir?: string
  exclude?: string[]
}

type ResolvedId = {
  id: string
}

export async function injectImportingIslands(
  options?: InjectImportingIslandsOptions
): Promise<Plugin> {
  let appPath = ''
  const islandDir = options?.islandDir ?? '/app/islands'
  const excludePatterns = (options?.exclude ?? []).map((dir) => {
    const segments = normalizePath(dir).split('/').filter(Boolean)
    return '/' + segments.join('/') + '/'
  })
  let root = ''
  let config: ResolvedConfig
  const resolvedCache = new Map<string, Promise<ResolvedId | null>>()
  const cache = new Map<string, string>()
  const depTreeCache = new Map<string, string[]>()

  const shouldExclude = (depPath: string) => {
    return excludePatterns.some((pattern) => depPath.includes(pattern))
  }

  const walkDependencyTree: (
    baseFile: string,
    resolve: (path: string, importer?: string) => Promise<ResolvedId | null>,
    dependencyFile?: ResolvedId | string,
    seen?: Set<string>
  ) => Promise<string[]> = async (baseFile: string, resolve, dependencyFile?, seen = new Set()) => {
    const depPath = dependencyFile
      ? typeof dependencyFile === 'string'
        ? normalizePath(path.join(path.dirname(baseFile), dependencyFile) + '.tsx')
        : normalizePath(dependencyFile['id'])
      : normalizePath(baseFile)

    if (depTreeCache.has(depPath)) {
      return depTreeCache.get(depPath)!
    }

    if (shouldExclude(depPath)) {
      return []
    }

    if (seen.has(depPath)) {
      return [depPath]
    }
    const deps = [depPath]
    const nextSeen = new Set(seen).add(depPath)

    try {
      if (!cache.has(depPath)) {
        cache.set(depPath, (await readFile(depPath, { flag: '' })).toString())
      }

      const currentFileDeps = precinct(cache.get(depPath)!, {
        type: 'tsx',
      }) as string[]

      const childDeps = await Promise.all(
        currentFileDeps.map(async (file) => {
          const resolvedId = await resolve(file, depPath)
          return await walkDependencyTree(depPath, resolve, resolvedId ?? file, nextSeen)
        })
      )
      deps.push(...childDeps.flat())
    } catch {
      // file does not exist or is a directory
    }
    depTreeCache.set(depPath, deps)
    return deps
  }

  const clearCaches = () => {
    resolvedCache.clear()
    cache.clear()
    depTreeCache.clear()
  }

  return {
    name: 'inject-importing-islands',
    buildStart() {
      clearCaches()
    },
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', clearCaches)
    },
    watchChange() {
      clearCaches()
    },
    configResolved: async (resolveConfig) => {
      config = resolveConfig
      appPath = path.join(config.root, options?.appDir ?? '/app')
      root = config.root
    },
    async transform(sourceCode, id) {
      const normalizedId = normalizePath(path.resolve(id))

      if (!normalizedId.startsWith(normalizePath(appPath))) {
        return
      }

      const resolve = async (importee: string, importer?: string) => {
        const cacheKey = `${importee}\0${importer ?? ''}`
        const cached = resolvedCache.get(cacheKey)

        if (cached) {
          return cached
        }

        const resolvedId = this.resolve(importee, importer) as Promise<ResolvedId | null>
        resolvedCache.set(cacheKey, resolvedId)
        return resolvedId
      }

      const hasIslandsImport = (
        await Promise.all(
          (await walkDependencyTree(normalizedId, resolve)).map(async (x) => {
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
